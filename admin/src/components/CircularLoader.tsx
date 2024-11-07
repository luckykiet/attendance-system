import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

// ==============================|| Loader ||============================== //

export interface CircularLoaderProps extends CircularProgressProps {}

const CircularLoader = () => <CircularProgress color="primary" />;

export default CircularLoader;
