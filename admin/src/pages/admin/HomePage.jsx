import { Button, Container, Grid, Stack, Typography, Card, CardContent, IconButton, CardActions } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchRetail } from '@/api/retail';
import useTranslation from '@/hooks/useTranslation';
import { fetchRegisters } from '@/api/registers';
import { Box } from '@mui/system';
import { useEffect } from 'react';
import { useSetRetail } from '@/stores/root';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import EditIcon from '@mui/icons-material/Edit';
import { checkPrivileges, DAYS_OF_WEEK, daysOfWeeksTranslations, getStartEndTime, getWorkingHoursText } from '@/utils';
import LoadingCircle from '@/components/LoadingCircle';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';

dayjs.extend(customParseFormat);

export default function HomePage() {
  const { t } = useTranslation();
  const config = useConfigStore();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setRetail = useSetRetail();

  const retailQuery = useQuery({
    queryKey: ['retail'],
    queryFn: () => fetchRetail(),
  });

  const { data: retail, isFetching: isRetailFetching, isLoading: isRetailLoading } = retailQuery;

  const registersQuery = useQuery({
    queryKey: ['registers'],
    queryFn: () => fetchRegisters(),
  });

  const { data: registers, isFetching: isRegistersFetching, isLoading: isRegistersLoading } = registersQuery;

  const handleCreateNewRegister = () => {
    navigate('/register');
  };

  const handleEditRegister = (id) => {
    navigate(`/register/${id}`);
  };

  const handleEditRetail = () => {
    navigate(`/retail`);
  };

  useEffect(() => {
    if (retail) {
      setRetail(retail);
    }
  }, [retail, setRetail]);

  const now = dayjs();
  const todayKey = DAYS_OF_WEEK[now.day()];
  const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

  return (
    <Container sx={{ mb: 4, pt: 6 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          {retail ? (
            <Stack spacing={2} display={'flex'} alignItems={'center'}>
              <Stack direction={'row'} spacing={2} >
                <Typography variant="h3">
                  {retail.name}
                </Typography>
                {checkPrivileges('editRetail', user?.role) && <IconButton
                  onClick={handleEditRetail}
                >
                  <EditIcon />
                </IconButton>}
              </Stack>
              <Typography variant="h4" gutterBottom>
                {t('misc_tin')}: {retail.tin}
              </Typography>
            </Stack>
          ) : (
            <Typography align="center" variant="h3" gutterBottom>
              {config.appName}
            </Typography>
          )}
        </Grid>
        {checkPrivileges('addRegister', user?.role) && <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" onClick={handleCreateNewRegister}>
              {t('misc_add_workplace')}
            </Button>
          </Box>
        </Grid>}

        <Grid size={{ xs: 12 }}>
          {isRegistersFetching || isRegistersLoading || isRetailFetching || isRetailLoading ?
            <LoadingCircle /> :
            registers && registers.length ? (
              <Stack spacing={2}>
                <Typography align="center" variant="h5" gutterBottom>
                  {t('misc_workplaces')}: {registers.length}
                </Typography>
                <Grid container spacing={2}>
                  {registers.map((register) => {
                    const yesterdayWorkingHours = register.workingHours[yesterdayKey];

                    const yesterdayWorkingHour = getStartEndTime({ start: yesterdayWorkingHours.start, end: yesterdayWorkingHours.end, isToday: false });

                    if (!yesterdayWorkingHour) return null;

                    const { startTime: start, endTime: end } = yesterdayWorkingHour;
                    const isToday = !now.isBetween(start, end);
                    const todayWorkingHours = register.workingHours[todayKey];

                    const { status, message } = getWorkingHoursText({
                      workingHour: isToday ? todayWorkingHours : yesterdayWorkingHours,
                      isToday,
                      t
                    })

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 6 }} key={register._id}>
                        <Card variant="outlined" sx={{ position: 'relative' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {register.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {register.address.street}, {register.address.city}, {register.address.zip}
                            </Typography>

                            {register.isAvailable && <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                color: status === 'open' ? 'success.main' : 'error.main',
                              }}
                            >
                              {status === 'closed' ? t(message) : `${status === 'open' ? t('misc_opening') : t('misc_closed')}`}
                            </Typography>}
                            {register.isAvailable && <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                color: status === 'open' ? 'success.main' : 'error.main',
                              }}
                            >
                              {t(daysOfWeeksTranslations[isToday ? todayKey : yesterdayKey].name)}: {t(message)}
                            </Typography>}
                            {!register.isAvailable && <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                color: register.isAvailable ? 'success.main' : 'error.main',
                              }}
                            >
                              {register.isAvailable ? t('misc_active') : t('misc_unavailable')}
                            </Typography>}
                          </CardContent>
                          {checkPrivileges('editRegister', user?.role) && <IconButton
                            onClick={() => handleEditRegister(register._id)}
                            sx={{ position: 'absolute', top: 8, right: 8 }}
                          >
                            <EditIcon />
                          </IconButton>}

                          <CardActions sx={{ display: 'flex', justifyContent: 'start' }}>
                            <Button onClick={() => navigate(`/attendance/${register._id}`)} variant='contained'>
                              {t('misc_attendances')}
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            ) : (
              <Typography align="center" variant="h5" gutterBottom>
                {t('misc_no_workplace')}
              </Typography>
            )}
        </Grid>
      </Grid>
    </Container>
  );
}
