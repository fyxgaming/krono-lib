import axios from 'axios';
import * as rax from 'retry-axios';

import {HttpError} from './http-error';

rax.attach();
axios.interceptors.response.use((r) => r, (e) => Promise.reject(e.response ? 
    new HttpError(e.response.status, e.response.data ): 
    new Error('Request Error')
));

export default axios;