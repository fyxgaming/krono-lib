import axios from 'axios';
import * as rax from 'retry-axios';
import * as createError from 'http-errors';

rax.attach();
axios.interceptors.response.use((r) => r, (e) => {
    if(e.response) throw createError(e.response.status, e.response.data)
    throw e;
});

export default axios;