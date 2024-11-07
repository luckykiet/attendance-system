import Notistack from '@/components/Notistack';
import { ReactNode } from 'react';
import Snackbar from '@/components/Snackbar';

interface Props {
  children: ReactNode;
}

const RootLayout = ({ children }: Props) => {
  return (
    <Notistack>
      <Snackbar />
      {children}
    </Notistack>
  );
};

export default RootLayout;
