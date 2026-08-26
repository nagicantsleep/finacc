import express from 'express';
import models from '../models/index.js';
import { is_authenticated } from '../libs/user.js';
import { requireTenant } from '../libs/tenant.js';

const router = express.Router();
const Op = models.Sequelize.Op;

router.use(is_authenticated, requireTenant);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calculateWorkMetrics(clockIn, clockOut, breakMinutes = 60) {
  if (!clockIn || !clockOut) {
    return { workHours: 0, overtimeHours: 0, lateMinutes: 0, earlyMinutes: 0 };
  }

  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const totalMinutes = Math.max(0, Math.floor((end - start) / (1000 * 60)) - breakMinutes);
  const workHours = Math.round((totalMinutes / 60) * 100) / 100;
  const standardHours = 8.00;
  const overtimeHours = workHours > standardHours ? Math.round((workHours - standardHours) * 100) / 100 : 0.00;

  // Standard schedule: 09:00 - 18:00
  const startHour = start.getHours() + start.getMinutes() / 60;
  const lateMinutes = startHour > 9.0 ? Math.floor((startHour - 9.0) * 60) : 0;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const earlyMinutes = endHour < 18.0 ? Math.floor((18.0 - endHour) * 60) : 0;

  return { workHours, overtimeHours, lateMinutes, earlyMinutes };
}

// ---------------------------------------------------------------------------
// Daily Clock In / Out
// ---------------------------------------------------------------------------

// Get today's attendance record
router.get('/today', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const today = new Date().toISOString().split('T')[0];

    const record = await models.AttendanceRecord.findOne({
      where: { tenantId, userId, date: today }
    });

    res.json({ code: 0, record, date: today });
  } catch (e) {
    console.error('Error in GET /api/attendance/today:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Clock In
router.post('/clock-in', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const today = req.body.date || new Date().toISOString().split('T')[0];
    const now = req.body.time ? new Date(req.body.time) : new Date();
    const note = req.body.note || '';
    const status = req.body.status || 'present';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

    // Find member profile
    const member = await models.TenantMember.findOne({
      where: { tenantId, userId }
    });

    let record = await models.AttendanceRecord.findOne({
      where: { tenantId, userId, date: today }
    });

    if (record && record.clockIn) {
      return res.status(400).json({ code: -1, message: 'Đã chấm công vào ca cho ngày hôm nay.' });
    }

    if (!record) {
      record = await models.AttendanceRecord.create({
        tenantId,
        userId,
        tenantMemberId: member ? member.id : null,
        date: today,
        clockIn: now,
        status,
        note,
        ipAddress
      });
    } else {
      record.clockIn = now;
      record.status = status;
      if (note) record.note = note;
      await record.save();
    }

    res.json({ code: 0, message: 'Chấm công vào ca thành công.', record });
  } catch (e) {
    console.error('Error in POST /api/attendance/clock-in:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Clock Out
router.post('/clock-out', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const today = req.body.date || new Date().toISOString().split('T')[0];
    const now = req.body.time ? new Date(req.body.time) : new Date();
    const note = req.body.note;

    let record = await models.AttendanceRecord.findOne({
      where: { tenantId, userId, date: today }
    });

    if (!record || !record.clockIn) {
      return res.status(400).json({ code: -1, message: 'Chưa có thông tin vào ca cho ngày hôm nay.' });
    }

    const { workHours, overtimeHours, lateMinutes, earlyMinutes } = calculateWorkMetrics(
      record.clockIn,
      now,
      record.breakMinutes || 60
    );

    record.clockOut = now;
    record.workHours = workHours;
    record.overtimeHours = overtimeHours;
    record.lateMinutes = lateMinutes;
    record.earlyMinutes = earlyMinutes;
    if (overtimeHours > 0) record.status = 'overtime';
    if (note) record.note = note;

    await record.save();

    res.json({ code: 0, message: 'Chấm công ra ca thành công.', record });
  } catch (e) {
    console.error('Error in POST /api/attendance/clock-out:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Monthly Timesheet
// ---------------------------------------------------------------------------
router.get('/monthly', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);
    const targetUserId = req.query.userId ? parseInt(req.query.userId, 10) : req.session.user.id;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const records = await models.AttendanceRecord.findAll({
      where: {
        tenantId,
        userId: targetUserId,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    });

    // Compute summary
    let totalWorkHours = 0;
    let totalOvertimeHours = 0;
    let totalLateMinutes = 0;
    let workingDays = 0;

    for (const r of records) {
      if (r.clockIn) {
        workingDays += 1;
        totalWorkHours += Number(r.workHours || 0);
        totalOvertimeHours += Number(r.overtimeHours || 0);
        totalLateMinutes += Number(r.lateMinutes || 0);
      }
    }

    res.json({
      code: 0,
      year,
      month,
      startDate,
      endDate,
      records,
      summary: {
        workingDays,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        totalLateMinutes
      }
    });
  } catch (e) {
    console.error('Error in GET /api/attendance/monthly:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Manual record upsert by manager
router.post('/record', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { userId, date, clockIn, clockOut, breakMinutes, status, note } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ code: -1, message: 'userId and date are required.' });
    }

    const member = await models.TenantMember.findOne({
      where: { tenantId, userId }
    });

    let record = await models.AttendanceRecord.findOne({
      where: { tenantId, userId, date }
    });

    const metrics = (clockIn && clockOut)
      ? calculateWorkMetrics(clockIn, clockOut, breakMinutes || 60)
      : { workHours: 0, overtimeHours: 0, lateMinutes: 0, earlyMinutes: 0 };

    if (!record) {
      record = await models.AttendanceRecord.create({
        tenantId,
        userId,
        tenantMemberId: member ? member.id : null,
        date,
        clockIn: clockIn || null,
        clockOut: clockOut || null,
        breakMinutes: breakMinutes !== undefined ? breakMinutes : 60,
        workHours: metrics.workHours,
        overtimeHours: metrics.overtimeHours,
        lateMinutes: metrics.lateMinutes,
        earlyMinutes: metrics.earlyMinutes,
        status: status || 'present',
        note: note || ''
      });
    } else {
      if (clockIn !== undefined) record.clockIn = clockIn;
      if (clockOut !== undefined) record.clockOut = clockOut;
      if (breakMinutes !== undefined) record.breakMinutes = breakMinutes;
      record.workHours = metrics.workHours;
      record.overtimeHours = metrics.overtimeHours;
      record.lateMinutes = metrics.lateMinutes;
      record.earlyMinutes = metrics.earlyMinutes;
      if (status) record.status = status;
      if (note !== undefined) record.note = note;
      await record.save();
    }

    res.json({ code: 0, record });
  } catch (e) {
    console.error('Error in POST /api/attendance/record:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// ---------------------------------------------------------------------------
// Leave Requests
// ---------------------------------------------------------------------------

// List leave requests
router.get('/leaves', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const { status, allMembers } = req.query;

    const where = { tenantId };
    if (!allMembers) {
      where.userId = req.session.user.id;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const leaves = await models.LeaveRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
        { model: models.User, as: 'reviewer', attributes: ['id', 'name', 'legalName'] }
      ]
    });

    res.json({ code: 0, leaves });
  } catch (e) {
    console.error('Error in GET /api/attendance/leaves:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Submit leave request
router.post('/leaves', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const userId = req.session.user.id;
    const { leaveType, startDate, endDate, days, reason } = req.body;

    if (!startDate || !endDate || !days) {
      return res.status(400).json({ code: -1, message: 'startDate, endDate, and days are required.' });
    }

    const member = await models.TenantMember.findOne({
      where: { tenantId, userId }
    });

    const leave = await models.LeaveRequest.create({
      tenantId,
      userId,
      tenantMemberId: member ? member.id : null,
      leaveType: leaveType || 'paid_annual',
      startDate,
      endDate,
      days: parseFloat(days),
      reason: reason || '',
      status: 'pending'
    });

    res.json({ code: 0, leave });
  } catch (e) {
    console.error('Error in POST /api/attendance/leaves:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

// Review leave request (approve / reject)
router.put('/leaves/:id/review', async (req, res) => {
  try {
    const tenantId = req.currentTenantId;
    const reviewerId = req.session.user.id;
    const id = parseInt(req.params.id, 10);
    const { status, reviewComment } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ code: -1, message: 'Invalid review status.' });
    }

    const leave = await models.LeaveRequest.findOne({
      where: { id, tenantId }
    });

    if (!leave) {
      return res.status(404).json({ code: -1, message: 'Leave request not found.' });
    }

    leave.status = status;
    leave.reviewedById = reviewerId;
    leave.reviewedAt = new Date();
    if (reviewComment) leave.reviewComment = reviewComment;
    await leave.save();

    // If approved, create/update attendance records for the leave period
    if (status === 'approved') {
      const cur = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];
        const [att] = await models.AttendanceRecord.findOrCreate({
          where: { tenantId, userId: leave.userId, date: dateStr },
          defaults: {
            tenantId,
            userId: leave.userId,
            tenantMemberId: leave.tenantMemberId,
            date: dateStr,
            status: 'leave',
            note: `Nghỉ phép (${leave.leaveType})`
          }
        });
        if (att.status !== 'leave') {
          att.status = 'leave';
          att.note = `Nghỉ phép (${leave.leaveType})`;
          await att.save();
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    res.json({ code: 0, leave });
  } catch (e) {
    console.error('Error in PUT /api/attendance/leaves/:id/review:', e);
    res.status(500).json({ code: -1, message: e.message });
  }
});

export default router;
