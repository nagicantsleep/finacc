import { json } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';

const Op = models.Sequelize.Op;

function fail(e, status = 500) {
  console.error(e);
  return json({ code: -1, message: e.message }, { status });
}

function calculateWorkMetrics(clockIn, clockOut, breakMinutes = 60) {
  if (!clockIn || !clockOut) {
    return { workHours: 0, overtimeHours: 0, lateMinutes: 0, earlyMinutes: 0 };
  }
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const totalMinutes = Math.max(0, Math.floor((end - start) / (1000 * 60)) - breakMinutes);
  const workHours = Math.round((totalMinutes / 60) * 100) / 100;
  const standardHours = 8.0;
  const overtimeHours = workHours > standardHours ? Math.round((workHours - standardHours) * 100) / 100 : 0.0;
  const startHour = start.getHours() + start.getMinutes() / 60;
  const lateMinutes = startHour > 9.0 ? Math.floor((startHour - 9.0) * 60) : 0;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const earlyMinutes = endHour < 18.0 ? Math.floor((18.0 - endHour) * 60) : 0;
  return { workHours, overtimeHours, lateMinutes, earlyMinutes };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export async function handleAttendance(method, { locals, url, body, getClientAddress }) {
  const tenantId = locals.tenantId;
  const userId = locals.user?.id;
  const parts = url.pathname.replace(/^\/api\/attendance\/?/, '').split('/').filter(Boolean);

  try {
    if (method === 'GET' && parts[0] === 'today') {
      const today = todayStr();
      const record = await models.AttendanceRecord.findOne({
        where: { tenantId, userId, date: today }
      });
      return json({ code: 0, record, date: today });
    }

    if (method === 'POST' && parts[0] === 'clock-in') {
      const today = body.date || todayStr();
      const now = body.time ? new Date(body.time) : new Date();
      const note = body.note || '';
      const status = body.status || 'present';
      const ipAddress = getClientAddress?.() || null;
      const member = await models.TenantMember.findOne({ where: { tenantId, userId } });
      let record = await models.AttendanceRecord.findOne({ where: { tenantId, userId, date: today } });
      if (record && record.clockIn) {
        return json({ code: -1, message: 'Đã chấm công vào ca cho ngày hôm nay.' }, { status: 400 });
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
      return json({ code: 0, message: 'Chấm công vào ca thành công.', record });
    }

    if (method === 'POST' && parts[0] === 'clock-out') {
      const today = body.date || todayStr();
      const now = body.time ? new Date(body.time) : new Date();
      const note = body.note;
      const record = await models.AttendanceRecord.findOne({ where: { tenantId, userId, date: today } });
      if (!record || !record.clockIn) {
        return json({ code: -1, message: 'Chưa có thông tin vào ca cho ngày hôm nay.' }, { status: 400 });
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
      return json({ code: 0, message: 'Chấm công ra ca thành công.', record });
    }

    if (method === 'GET' && parts[0] === 'monthly') {
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear(), 10);
      const month = parseInt(url.searchParams.get('month') || new Date().getMonth() + 1, 10);
      const targetUserId = url.searchParams.get('userId')
        ? parseInt(url.searchParams.get('userId'), 10)
        : userId;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const records = await models.AttendanceRecord.findAll({
        where: { tenantId, userId: targetUserId, date: { [Op.between]: [startDate, endDate] } },
        order: [['date', 'ASC']]
      });
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
      return json({
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
    }

    if (method === 'POST' && parts[0] === 'record') {
      const { userId: targetUserId, date, clockIn, clockOut, breakMinutes, status, note } = body;
      if (!targetUserId || !date) {
        return json({ code: -1, message: 'userId and date are required.' }, { status: 400 });
      }
      const member = await models.TenantMember.findOne({ where: { tenantId, userId: targetUserId } });
      let record = await models.AttendanceRecord.findOne({
        where: { tenantId, userId: targetUserId, date }
      });
      const metrics = clockIn && clockOut
        ? calculateWorkMetrics(clockIn, clockOut, breakMinutes || 60)
        : { workHours: 0, overtimeHours: 0, lateMinutes: 0, earlyMinutes: 0 };
      if (!record) {
        record = await models.AttendanceRecord.create({
          tenantId,
          userId: targetUserId,
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
      return json({ code: 0, record });
    }

    if (parts[0] === 'leaves' && !parts[1]) {
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        const allMembers = url.searchParams.get('allMembers');
        const where = { tenantId };
        if (!allMembers) where.userId = userId;
        if (status && status !== 'all') where.status = status;
        const leaves = await models.LeaveRequest.findAll({
          where,
          order: [['createdAt', 'DESC']],
          include: [
            { model: models.User, as: 'user', attributes: ['id', 'name', 'legalName', 'email'] },
            { model: models.User, as: 'reviewer', attributes: ['id', 'name', 'legalName'] }
          ]
        });
        return json({ code: 0, leaves });
      }
      if (method === 'POST') {
        const { leaveType, startDate, endDate, days, reason } = body;
        if (!startDate || !endDate || !days) {
          return json({ code: -1, message: 'startDate, endDate, and days are required.' }, { status: 400 });
        }
        const member = await models.TenantMember.findOne({ where: { tenantId, userId } });
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
        return json({ code: 0, leave });
      }
    }

    if (method === 'PUT' && parts[0] === 'leaves' && parts[2] === 'review') {
      const id = parseInt(parts[1], 10);
      const { status, reviewComment } = body;
      if (!['approved', 'rejected', 'cancelled'].includes(status)) {
        return json({ code: -1, message: 'Invalid review status.' }, { status: 400 });
      }
      const leave = await models.LeaveRequest.findOne({ where: { id, tenantId } });
      if (!leave) return json({ code: -1, message: 'Leave request not found.' }, { status: 404 });
      leave.status = status;
      leave.reviewedById = userId;
      leave.reviewedAt = new Date();
      if (reviewComment) leave.reviewComment = reviewComment;
      await leave.save();
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
      return json({ code: 0, leave });
    }

    return json({ code: -1, message: 'Not found' }, { status: 404 });
  } catch (e) {
    return fail(e);
  }
}
