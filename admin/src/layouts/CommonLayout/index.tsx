import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import { Suspense, lazy } from 'react';

import { Outlet } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import { styled } from '@mui/material/styles';

const Header = lazy(() => import('./Header'));
const FooterBlock = lazy(() => import('./FooterBlock'));

// ==============================|| LOADER - WRAPPER ||============================== //

const LoaderWrapper = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 2001,
  width: '100%',
  '& > * + *': {
    marginTop: theme.spacing(2)
  }
}));

export interface LoaderProps extends LinearProgressProps {}

const Loader = () => (
  <LoaderWrapper>
    <LinearProgress color="primary" />
  </LoaderWrapper>
);

// ==============================|| MINIMAL LAYOUT ||============================== //

const CommonLayout = ({ layout = 'simple' }: { layout?: 'simple' | 'blank' }) => (
  <RootLayout>
    {layout === 'simple' && (
      <Suspense fallback={<Loader />}>
        <Header layout={layout} />
        <Outlet />
        <FooterBlock />
      </Suspense>
    )}
    {layout === 'blank' && <Outlet />}
  </RootLayout>
);

export default CommonLayout;
