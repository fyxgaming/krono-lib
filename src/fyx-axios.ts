import axios from 'axios';
import createError from 'http-errors';

axios.interceptors.response.use((r) => r, (e) => {
    if(e.response) throw createError(e.response.status, `${e.config.url} - ${JSON.stringify(e.response.data)}`)
    throw e;
});

export default axios;