import PropTypes from 'prop-types';
import GlobalAlert from '@/components/GlobalAlert';

export default function RootLayout({ children }) {
  return (
    <>
      <GlobalAlert />
      {children}
    </>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node
};
