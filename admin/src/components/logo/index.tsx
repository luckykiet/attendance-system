import { ButtonBase } from '@mui/material';
import { Link } from 'react-router-dom';
import Logo from './LogoMain';
import LogoIcon from './LogoIcon';
import { SxProps } from '@mui/system';
import { To } from 'history';

interface Props {
  isIcon?: boolean;
  sx?: SxProps;
  to?: To;
}

const LogoSection = ({ isIcon, sx, to }: Props) => (
  <ButtonBase disableRipple component={Link} to={!to ? '/' : to} sx={sx}>
    {isIcon ? <LogoIcon /> : <Logo />}
  </ButtonBase>
);

export default LogoSection;
