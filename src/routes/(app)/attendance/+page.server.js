import { redirect } from '@sveltejs/kit';
import models from '$lib/server/db/index.js';
import { asJson } from '$lib/server/api-guard.js';

const Op = models.Sequelize.Op;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (!locals.tenantId) throw redirect(303, '/logon');

  const today = todayStr();
  const todayRecord = await models.AttendanceRecord.findOne({
    where: { tenantId: locals.tenantId, userId: locals.user.id, date: today }
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;

  const records = await models.AttendanceRecord.findAll({
    where: {
      tenantId: locals.tenantId,
      userId: locals.user.id,
      date: { [Op.between]: [startOfMonth, endOfMonth] }
    },
    order: [['date', 'ASC']]
  });

  let workingDays = 0;
  let totalWorkHours = 0;
  let totalOvertimeHours = 0;
  let totalLateMinutes = 0;

  records.forEach((r) => {
    if (r.status === 'present' || r.status === 'late' || r.status === 'early_leave') {
      workingDays += 1;
    }
    totalWorkHours += parseFloat(r.workHours || 0);
    totalOvertimeHours += parseFloat(r.overtimeHours || 0);
    totalLateMinutes += parseInt(r.lateMinutes || 0, 10);
  });

  return {
    user: locals.user,
    tenant: locals.tenant,
    currentFy: locals.currentFy,
    todayRecord: asJson(todayRecord),
    records: asJson(records),
    summary: {
      workingDays,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalLateMinutes
    }
  };
}
