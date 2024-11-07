import { CSSProperties, ReactNode, Ref, forwardRef } from 'react';
import { Card, CardContent, CardContentProps, CardHeader, CardHeaderProps, CardProps, Divider, Typography } from '@mui/material';

import { KeyedObject } from '@/types/root';

import { alpha, useTheme } from '@mui/material/styles';

// header style
const headerSX = {
  p: 2.5,
  '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' }
};

export interface MainCardProps extends KeyedObject {
  border?: boolean;
  boxShadow?: boolean;
  children?: ReactNode | string;
  subheader?: ReactNode | string;
  style?: CSSProperties;
  content?: boolean;
  contentSX?: CardContentProps['sx'];
  darkTitle?: boolean;
  divider?: boolean;
  sx?: CardProps['sx'];
  secondary?: CardHeaderProps['action'];
  shadow?: string;
  elevation?: number;
  title?: ReactNode | string;
  customHeader?: ReactNode;
  codeHighlight?: boolean;
  codeString?: string;
  modal?: boolean;
}

const MainCard = forwardRef(
  (
    {
      border = true,
      children,
      subheader,
      content = true,
      contentSX = {},
      darkTitle,
      divider = true,
      elevation,
      secondary,
      shadow,
      sx = {},
      title,
      customHeader,
      codeHighlight = false,
      modal = false,
      ...others
    }: MainCardProps,
    ref: Ref<HTMLDivElement>
  ) => {
    const theme = useTheme();

    return (
      <Card
        elevation={elevation || 0}
        ref={ref}
        {...others}
        sx={{
          position: 'relative',
          border: border ? '1px solid' : 'none',
          borderRadius: 1.5,
          borderColor: theme.palette.divider,
          ...((shadow) && {
            boxShadow: shadow ? shadow : `0px 8px 24px  ${alpha(theme.palette.secondary.dark, 0.08)}`
          }),
          ...(codeHighlight && {
            '& pre': {
              m: 0,
              p: '12px !important',
              fontFamily: theme.typography.fontFamily,
              fontSize: '0.75rem'
            }
          }),
          ...(modal && {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: `calc( 100% - 50px)`, sm: 'auto' },
            '& .MuiCardContent-root': {
              overflowY: 'auto',
              minHeight: 'auto',
              maxHeight: `calc(100vh - 200px)`
            }
          }),
          ...sx
        }}
      >
        {/* card header and action */}
        {customHeader ? (
          customHeader
        ) : (
          <>
            {!darkTitle && title && (
              <CardHeader
                sx={headerSX}
                titleTypographyProps={{ variant: 'subtitle1' }}
                title={title}
                action={secondary}
                subheader={subheader}
              />
            )}
            {darkTitle && title && <CardHeader sx={headerSX} title={<Typography variant="h4">{title}</Typography>} action={secondary} />}
          </>
        )}

        {/* content & header divider */}
        {(title || customHeader) && divider && <Divider />}

        {/* card content */}
        {content && <CardContent sx={contentSX}>{children}</CardContent>}
        {!content && children}
      </Card>
    );
  }
);

export default MainCard;
