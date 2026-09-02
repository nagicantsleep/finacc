import { restHandlers } from '$lib/server/master/rest-dispatch.js';
import { handleRegistry } from '$lib/server/master/registry-api.js';

export const { GET, POST, PUT, DELETE } = restHandlers(handleRegistry);
