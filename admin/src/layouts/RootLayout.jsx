import PropTypes from 'prop-types';
import GlobalAlert from '@/components/GlobalAlert';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function RootLayout({ children }) {
  return (
    <>
      <GlobalAlert />
      <ConfirmDialog />
      {children}
    </>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node
};
