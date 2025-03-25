import { Container, Typography, TextField, Grid2, Stack, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, FormHelperText, IconButton, InputAdornment } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';
import useTranslation from '@/hooks/useTranslation';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import LoadingCircle from '@/components/LoadingCircle';
import { fetchUser, createUser, updateUser, deleteUser } from '@/api/user';
import { checkPrivileges, getDefaultUser, REGEX } from '@/utils';
import { useEffect, useState } from 'react';
import useRecaptchaV3 from '@/hooks/useRecaptchaV3';
import { ROLES, useRoles } from '@/configs';
import FeedbackMessage from '@/components/FeedbackMessage';
import { LoadingButton } from '@mui/lab';
import _ from 'lodash';
import { useSetAlertMessage } from '@/stores/root';
import { useAuthStore } from '@/stores/auth';
import { useSetConfirmBox } from '@/stores/confirm';
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useConfigStore } from '@/stores/config';

dayjs.extend(customParseFormat);

const userSchema = z.object({
    userId: z.string().optional(),
    name: z.string().min(1, { message: 'misc_required' }).max(255),
    email: z.string().email({ message: 'srv_invalid_email' }),
    username: z
        .string({ required_error: 'misc_required' })
        .trim()
        .min(6, { message: 'srv_username_length' })
        .max(20, { message: 'srv_username_length' })
        .regex(REGEX.username, { message: 'srv_username_no_whitespace' }),
    phone: z
        .string()
        .optional()
        .refine((val) => !val || REGEX.phone.test(val), { message: 'srv_invalid_phone' }),
    password: z
        .string()
        .min(8, { message: 'srv_password_length' })
        .max(255, { message: 'srv_password_length' })
        .optional()
        .or(z.literal('')),
    confirmPassword: z
        .string()
        .max(255, { message: 'srv_password_length' })
        .optional()
        .or(z.literal('')),
    role: z.enum(ROLES, { message: 'srv_invalid_role' }),
    notes: z.string().optional(),
    isAvailable: z.boolean(),
}).superRefine((data, ctx) => {
    if (!data.userId && !data.password) {
        ctx.addIssue({
            path: ['password'],
            message: 'misc_required',
        });
    }

    if (!data.userId && !data.confirmPassword) {
        ctx.addIssue({
            path: ['confirmPassword'],
            message: 'misc_required',
        });
    }

    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
        ctx.addIssue({
            path: ['confirmPassword'],
            message: 'srv_passwords_not_match',
        });
    }
});

export default function UserPage() {
    const { userId } = useParams();
    const config = useConfigStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user: loggedInUser } = useAuthStore();
    const queryClient = useQueryClient();
    const executeRecaptcha = useRecaptchaV3(config.grecaptchaSiteKey);
    const [postMsg, setPostMsg] = useState('');
    const setAlertMessage = useSetAlertMessage();
    const setConfirmBox = useSetConfirmBox();
    const ROLES = useRoles();

    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword(!showPassword);

    const handleMouseDownPassword = (event) => event.preventDefault();

    const userQuery = useQuery({
        queryKey: ['user', { userId }],
        queryFn: () => fetchUser(userId),
        enabled: !!userId,
    });

    const { data: user, isLoading: isUserLoading } = userQuery;

    const mainForm = useForm({
        mode: 'all',
        resolver: zodResolver(userSchema),
        defaultValues: getDefaultUser(),
    });

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = mainForm;

    const createUserMutation = useMutation({
        mutationFn: (data) => createUser(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['users']);
            navigate(`/user/${data._id}`, { replace: true });
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: (data) => updateUser(data),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['user', { userId }]);
            queryClient.invalidateQueries(['users']);
            setPostMsg(data);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: () => deleteUser(userId),
        onError: (error) => {
            setPostMsg(new Error(JSON.stringify(error)))
        },
        onSuccess: (data) => {
            setAlertMessage({ msg: data, severity: 'success' });
            queryClient.invalidateQueries(['users']);
            navigate('/users');
        }
    })

    const onSubmit = async (data) => {
        try {
            setPostMsg('');
            const recaptchaToken = await executeRecaptcha(`${userId ? 'update' : 'create'}user`);

            if (userId) {
                updateUserMutation.mutate({ ...data, _id: userId, recaptcha: recaptchaToken });
            } else {
                createUserMutation.mutate({ ...data, recaptcha: recaptchaToken });
            }
        }
        catch (error) {
            setPostMsg(error instanceof Error ? error : new Error(error));
        }

    };

    const handleDelete = () => {
        setConfirmBox({
            mainText: `${t('misc_delete')} ${user.name}?`,
            onConfirm: () => {
                deleteUserMutation.mutate();
            },
        })
    }

    useEffect(() => {
        if (user) {
            reset({ ...getDefaultUser(), ...user, userId: user._id });
        }
    }, [user, reset]);

    if (isUserLoading) {
        return (
            <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
                <LoadingCircle />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mb: 4, pt: 6 }}>
            {loggedInUser?.id !== userId && !checkPrivileges('createUser', loggedInUser?.role) ? <Typography color='error' variant='h6'>{t('srv_no_permission')}</Typography> :
                <Stack spacing={3}>
                    <Typography variant="h5">
                        {userId ? user ? user.name : t('srv_user_not_found') : t('misc_new_user')}
                    </Typography>
                    {user || !userId ? (
                        <FormProvider {...mainForm}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Grid2 container spacing={2}>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="name"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('misc_name')}
                                                    variant="outlined"
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.error?.message && t(fieldState.error.message)}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="username"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('misc_username')}
                                                    variant="outlined"
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.error?.message && t(fieldState.error.message)}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('misc_email')}
                                                    variant="outlined"
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.error?.message && t(fieldState.error.message)}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="phone"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('misc_telephone')}
                                                    variant="outlined"
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.error?.message && t(fieldState.error.message)}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="role"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <FormControl fullWidth>
                                                    <InputLabel id="selectRole-label">
                                                        {t('misc_role')}
                                                    </InputLabel>
                                                    <Select
                                                        {...field}
                                                        labelId="selectRole-label"
                                                        id="selectRole"
                                                        label={`${t('misc_role')}`}
                                                        error={fieldState.invalid}
                                                        onBlur={handleSubmit}
                                                        sx={{
                                                            textOverflow: 'ellipsis',
                                                            overflow: 'hidden',
                                                            whiteSpace: 'pre',
                                                        }}
                                                    >
                                                        {ROLES.map((r) => (
                                                            <MenuItem color={r.color} value={r.key} key={r.key}>
                                                                {t(r.name)}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {fieldState.invalid && (
                                                        <FormHelperText
                                                            sx={{
                                                                color: (theme) => theme.palette.error.main,
                                                            }}
                                                        >
                                                            {fieldState.error.message}
                                                        </FormHelperText>
                                                    )}
                                                </FormControl>

                                            )}
                                        />
                                    </Grid2>
                                    {!userId && <>
                                        <Grid2 size={{ xs: 12 }}>
                                            <Controller
                                                name="password"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        variant="outlined"
                                                        label={t('misc_password')}
                                                        fullWidth
                                                        type={showPassword ? 'text' : 'password'}
                                                        error={fieldState.invalid}
                                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton
                                                                            onClick={handleClickShowPassword}
                                                                            onMouseDown={handleMouseDownPassword}
                                                                            edge="end"
                                                                        >
                                                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                ),
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        </Grid2>
                                        <Grid2 size={{ xs: 12 }}>
                                            <Controller
                                                name="confirmPassword"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        variant="outlined"
                                                        label={t('misc_confirm_password')}
                                                        fullWidth
                                                        autoComplete='off'
                                                        type="password"
                                                        error={fieldState.invalid}
                                                        helperText={fieldState.invalid && t(fieldState.error.message)}
                                                    />
                                                )}
                                            />
                                        </Grid2>
                                    </>}
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="notes"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    label={t('misc_notes')}
                                                    variant="outlined"
                                                    error={fieldState.invalid}
                                                    helperText={fieldState.error?.message && t(fieldState.error.message)}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Controller
                                            name="isAvailable"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={<Switch {...field} checked={field.value} />}
                                                    label={t('misc_available')}
                                                />
                                            )}
                                        />
                                    </Grid2>
                                </Grid2>
                                <Grid2 container spacing={2} sx={{ mt: 3 }}>
                                    <Grid2 size={{ xs: 12 }}>
                                        {postMsg && <FeedbackMessage message={postMsg} />}
                                    </Grid2>
                                    <Grid2 size={{ xs: 12 }}>
                                        <Stack direction="row" spacing={1}>
                                            <LoadingButton sx={{ minWidth: '200px' }} variant="contained" color="success" type="submit" loading={createUserMutation.isPending || updateUserMutation.isPending} disabled={deleteUserMutation.isPending || !_.isEmpty(errors)}>
                                                {userId ? t('misc_save') : t('misc_create')}
                                            </LoadingButton>
                                            {user && checkPrivileges('deleteUser', loggedInUser?.role) &&
                                                <LoadingButton sx={{ minWidth: '200px' }} variant="outlined" color="error" loading={deleteUserMutation.isPending} disabled={createUserMutation.isPending || updateUserMutation.isPending} onClick={handleDelete}>
                                                    {t('misc_delete')}
                                                </LoadingButton>}
                                        </Stack>
                                    </Grid2>
                                </Grid2>
                            </form>
                        </FormProvider>
                    ) : (
                        <Typography variant='h6'>{t('srv_user_not_found')}</Typography>
                    )}
                </Stack>
            }
        </Container>
    );
}
