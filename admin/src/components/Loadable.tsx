import { ElementType, Suspense } from 'react';

import Loader from './Loader';

const Loadable = <P extends object>(Component: ElementType) => (props: P) => (
  <Suspense fallback={<Loader />}>
    <Component {...props} />
  </Suspense>
);

export default Loadable;
