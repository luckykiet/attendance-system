import {
  Box,
  ClickAwayListener,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Stack,
  SvgIcon,
  Typography,
  useMediaQuery,
  Grow
} from '@mui/material';
import { I18n } from '@/types/config';
import { useRef, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import { LOCALES } from '@/config';
import { LanguageSquare } from 'iconsax-react';
import MainCard from '@/components/MainCard';
import { capitalizeFirstLetterOfString } from '@/utils/functions';
import { useTheme } from '@mui/material/styles';
import useLocaleStore from '@/stores/locale';

const Localization = () => {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  const { locale, setLocale } = useLocaleStore();

  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current instanceof HTMLElement && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  const handleListItemClick = (lang: I18n) => {
    setLocale(lang);
    setOpen(false);
  };

  const iconBackColorOpen = 'secondary.200';
  const iconBackColor = 'secondary.100';

  const index = LOCALES.findIndex((l) => l.key === locale);
  const Logo = LOCALES[index]?.logo;

  return (
    <Box sx={{ flexShrink: 0, ml: 0.5 }}>
      <IconButton
        color="secondary"

        aria-label="open localization"
        ref={anchorRef}
        aria-controls={open ? 'localization-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        size="large"
        sx={{ color: 'secondary.main', bgcolor: open ? iconBackColorOpen : iconBackColor, p: 1 }}
      >
        {index !== -1 ? (
          <SvgIcon>
            <Logo />
          </SvgIcon>
        ) : (
          <LanguageSquare variant="Bulk" size={26} />
        )}
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom-start' : 'bottom'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 12]  // Adjust vertical offset if needed
            }
          }
        ]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper sx={{ borderRadius: 1.5 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard border={false} content={false}>
                  <List
                    component="nav"
                    sx={{
                      p: 1,
                      width: '100%',
                      minWidth: 200,
                      maxWidth: 290,
                      bgcolor: theme.palette.background.paper,
                      [theme.breakpoints.down('md')]: {
                        maxWidth: 250
                      }
                    }}
                  >
                    {LOCALES.map((l) => (
                      <ListItemButton
                        sx={{ display: 'flex', alignItems: 'center' }}
                        key={l.key}
                        selected={locale === l.key}
                        onClick={() => handleListItemClick(l.key)}
                      >
                        <ListItemIcon>
                          <SvgIcon>{<l.logo />}</SvgIcon>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction={'row'}>
                              <Typography color="textPrimary">{capitalizeFirstLetterOfString(l.name)}</Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ ml: '8px' }}>
                                ({l.key.toUpperCase()})
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};

export default Localization;
