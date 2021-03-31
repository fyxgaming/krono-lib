import axios from 'axios';
import * as rax from 'retry-axios';

import {HttpError} from './http-error';

rax.attach();
axios.interceptors.response.use((r) => r, (e) => {
    if(!e.response) throw new HttpError(e.response.status, e.response.data)
    throw e;
});

export default axios;