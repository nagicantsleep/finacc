import { restHandlers } from '$lib/server/master/rest-dispatch.js';
import { handleAttendance } from '$lib/server/master/attendance-api.js';

export const { GET, POST, PUT, DELETE } = restHandlers(handleAttendance);
