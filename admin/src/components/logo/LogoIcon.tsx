import { BASE_NAME } from '@/config';
import logo from '@/assets/images/logo/react.svg';

// ==============================|| LOGO ICON ||============================== //

const LogoIcon = () => {
  return <img src={logo} alt={`${BASE_NAME} logo`} width="50" />;
};

export default LogoIcon;
