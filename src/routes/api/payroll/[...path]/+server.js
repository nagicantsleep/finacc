import { restHandlers } from '$lib/server/master/rest-dispatch.js';
import { handlePayroll } from '$lib/server/master/payroll-api.js';

export const { GET, POST, PUT, DELETE } = restHandlers(handlePayroll);
