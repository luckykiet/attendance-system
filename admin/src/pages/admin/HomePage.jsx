import { Button, Container, Grid, Stack, Typography, Card, CardContent, IconButton, CardActions, Divider } from '@mui/material';
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
import { checkPrivileges, DAYS_OF_WEEK, daysOfWeeksTranslations, getWorkingHoursText } from '@/utils';
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

                    const yesterdayOpeningText = getWorkingHoursText({
                      workingHour: yesterdayWorkingHours,
                      isToday: false,
                      t
                    })

                    const isYesterdayStillOpen = yesterdayWorkingHours.isAvailable && yesterdayOpeningText.status !== 'out_of_time';

                    const todayWorkingHours = register.workingHours[todayKey];

                    const todayOpeningText = getWorkingHoursText({
                      workingHour: todayWorkingHours,
                      isToday: true,
                      t
                    })
                    const isTodayStillOpen = todayWorkingHours.isAvailable && todayOpeningText.status !== 'out_of_time';

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 6 }} key={register._id}>
                        <Card variant="outlined" sx={{ position: 'relative' }}>
                          <CardContent>
                            <Stack spacing={1}>
                              <Typography variant="h6" gutterBottom>
                                {register.name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {register.address.street}, {register.address.city}, {register.address.zip}
                              </Typography>

                              {register.isAvailable ?
                                <>
                                  {isYesterdayStillOpen && <>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        mt: 1,
                                        color: 'success.main',
                                      }}
                                    >
                                      {t('misc_opening')}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        mt: 1,
                                        color: 'success.main',
                                      }}
                                    >
                                      {t(daysOfWeeksTranslations[yesterdayKey].name)} ({t('misc_yesterday')}): {t(yesterdayOpeningText.message)}
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                  </>}
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      mt: 1,
                                      color: isTodayStillOpen ? 'success.main' : 'error.main',
                                    }}
                                  >
                                    {isTodayStillOpen ? t('misc_opening') : t('misc_closed')}
                                  </Typography>
                                  {todayWorkingHours.isAvailable && <Typography
                                    variant="body2"
                                    sx={{
                                      mt: 1,
                                      color: isTodayStillOpen ? 'success.main' : 'error.main',
                                    }}
                                  >
                                    {t(daysOfWeeksTranslations[todayKey].name)}: {t(todayOpeningText.message)}
                                  </Typography>}
                                </>
                                :
                                <Typography
                                  variant="body2"
                                  sx={{
                                    mt: 1,
                                    color: 'error.main',
                                  }}
                                >
                                  {t('misc_unavailable')}
                                </Typography>
                              }

                            </Stack>
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
                            <Button onClick={() => navigate(`/register/dashboard/${register._id}`)} color='warning' variant='contained'>
                              {t('misc_dashboard')}
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
