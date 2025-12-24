import { Route as rootRoute } from './routes/__root';
import { Route as IndexRoute } from './routes/index';

const routeTree = rootRoute.addChildren([IndexRoute]);

export { routeTree };
