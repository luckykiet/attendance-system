import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  SvgIcon,
  Tooltip,
} from '@mui/material';
import { supportedLocales, supportedLocalesIcons } from '@/locales';
import { useLanguage, useSetLanguage } from '@/stores/root';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import { renderIcon } from '@/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

export default function LanguageSwitcher({ sx, withText = true }) {
  const {
    i18n: { changeLanguage },
  } = useTranslation();
  const [lang, setLang] = [useLanguage(), useSetLanguage()];
  const [anchorElNav, setAnchorElNav] = useState(null);
  
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleLanguageChange = (locale) => {
    const newlang = locale;
    localStorage.setItem('i18n-lang', newlang);
    setLang(newlang);
    changeLanguage(newlang);
    handleCloseNavMenu();
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <FormControl variant="standard" sx={sx}>
      <Box sx={{ flexGrow: 1, display: 'flex' }}>
        {withText ? (
          <Button
            onClick={handleOpenNavMenu}
            color="inherit"
            startIcon={
              <Tooltip title={supportedLocales[lang]}>
                <SvgIcon>{renderIcon(supportedLocalesIcons[lang])}</SvgIcon>
              </Tooltip>
            }
          >
            {supportedLocales[lang]}
          </Button>
        ) : (
          <Tooltip title={supportedLocales[lang]}>
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <SvgIcon>{renderIcon(supportedLocalesIcons[lang])}</SvgIcon>
            </IconButton>
          </Tooltip>
        )}
        <Menu
          anchorEl={anchorElNav}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{
            display: 'block',
          }}
        >
          {Object.entries(supportedLocales).map(([locale, label]) => (
            <MenuItem
              key={locale}
              value={locale}
              onClick={() => handleLanguageChange(locale)}
              sx={{
                backgroundColor:
                  lang === locale
                    ? (theme) => theme.palette.action.hover
                    : undefined,
              }}
            >
              <Tooltip title={supportedLocales[locale]}>
                <ListItemIcon sx={{ width: '24px', height: '24px' }}>
                  {renderIcon(supportedLocalesIcons[locale])}
                </ListItemIcon>
              </Tooltip>
              {withText && <ListItemText primary={label} />}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </FormControl>
  );
}

LanguageSwitcher.propTypes = {
  sx: PropTypes.object,
  withText: PropTypes.bool,
};
