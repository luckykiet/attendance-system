import { Button, Container, Grid2, Stack, Typography, Card, CardContent, IconButton, CardActions } from '@mui/material';
import { CONFIG } from '@/configs';
import { useQuery } from '@tanstack/react-query';
import { fetchRetail } from '@/api/retail';
import useTranslation from '@/hooks/useTranslation';
import { fetchRegisters } from '@/api/registers';
import { Box } from '@mui/system';
import DialogRegister from '@/components/admin/DialogRegister';
import { useSetIsModalOpen, useSetRegisterId } from '@/stores/register';
import { useEffect } from 'react';
import { useSetRetail } from '@/stores/root';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import EditIcon from '@mui/icons-material/Edit';
import { DAYS_OF_WEEK, TIME_FORMAT } from '@/utils';
import LoadingCircle from '@/components/LoadingCircle';
import { useNavigate } from 'react-router-dom';

dayjs.extend(customParseFormat);

const getTodayWorkingHours = (workingHours) => {
  const today = dayjs().day();
  const todayKey = DAYS_OF_WEEK[today];
  const hours = workingHours[todayKey];

  if (!hours?.isAvailable) {
    return { status: 'closed', message: 'misc_closed' };
  }

  const currentTime = dayjs();
  const openTime = dayjs(hours.start, TIME_FORMAT);
  const closeTime = dayjs(hours.end, TIME_FORMAT);

  if (currentTime.isBetween(openTime, closeTime)) {
    return { status: 'open', message: `${hours.start} - ${hours.end}` };
  }

  return { status: 'out_of_time', message: `${hours.start} - ${hours.end}` };
};

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setRegisterId = useSetRegisterId();
  const setRegisterIsModalOpen = useSetIsModalOpen();
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
    setRegisterId('');
    setRegisterIsModalOpen(true);
  };

  const handleEditRegister = (id) => {
    setRegisterId(id);
    setRegisterIsModalOpen(true);
  };

  useEffect(() => {
    if (retail) {
      setRetail(retail);
    }
  }, [retail, setRetail]);

  return (
    <Container sx={{ mb: 4, pt: 6 }}>
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12 }}>
          {retail ? (
            <Stack spacing={2}>
              <Typography align="center" variant="h3" gutterBottom>
                {retail.name}
              </Typography>
              <Typography align="center" variant="h4" gutterBottom>
                {t('misc_tin')}: {retail.tin}
              </Typography>
            </Stack>
          ) : (
            <Typography align="center" variant="h3" gutterBottom>
              {CONFIG.APP_NAME}
            </Typography>
          )}
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" onClick={handleCreateNewRegister}>
              {t('misc_new_company')}
            </Button>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <DialogRegister />
          {isRegistersFetching || isRegistersLoading || isRetailFetching || isRetailLoading ?
            <LoadingCircle /> :
            registers && registers.length ? (
              <Stack spacing={2}>
                <Typography align="center" variant="h5" gutterBottom>
                  {t('misc_companies')}: {registers.length}
                </Typography>
                <Grid2 container spacing={2}>
                  {registers.map((register) => {
                    const { status, message } = getTodayWorkingHours(register.workingHours);
                    return (
                      <Grid2 size={{ xs: 12, sm: 6, md: 6 }} key={register._id}>
                        <Card variant="outlined" sx={{ position: 'relative' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {register.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {register.address.street}, {register.address.city}, {register.address.zip}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                color: register.isAvailable ? 'success.main' : 'error.main',
                              }}
                            >
                              {register.isAvailable ? t('misc_active') : t('misc_unavailable')}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                color: status === 'open' ? 'success.main' : 'error.main',
                              }}
                            >
                              {status === 'closed' ? t(message) : `${status === 'open' ? t('misc_opening') : t('misc_closed')}: ${t(message)}`}
                            </Typography>
                          </CardContent>
                          <IconButton
                            onClick={() => handleEditRegister(register._id)}
                            sx={{ position: 'absolute', top: 8, right: 8 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <CardActions sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button onClick={() => navigate(`/attendance/${register._id}`)} variant='contained'>
                              {t('misc_attendances')}
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid2>
                    );
                  })}
                </Grid2>
              </Stack>
            ) : (
              <Typography align="center" variant="h5" gutterBottom>
                {t('misc_no_company')}
              </Typography>
            )}
        </Grid2>
      </Grid2>
    </Container>
  );
}
