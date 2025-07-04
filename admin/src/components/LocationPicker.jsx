import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import { useFormContext } from 'react-hook-form';
import { Button, Stack, Typography } from '@mui/material';
import axios from 'axios';
import useTranslation from '@/hooks/useTranslation';
import FeedbackMessage from './FeedbackMessage';
import LoadingCircle from './LoadingCircle';
import { useConfigStore } from '@/stores/config';
import { debounce } from 'lodash';

const mapContainerStyle = {
    width: '100%',
    height: '300px',
};

const defaultCenter = {
    lat: 50.073658, // Prague
    lng: 14.418540,
};

const GoogleMapPicker = () => {
    const { t } = useTranslation();
    const { setValue, watch } = useFormContext();
    const [selectedPosition, setSelectedPosition] = useState(defaultCenter);
    const [postMsg, setPostMsg] = useState('');
    const [searchedLocation, setSearchedLocation] = useState('');
    const [tempAddress, setTempAddress] = useState({ street: '', city: '', zip: '' });
    const [tempCoordinates, setTempCoordinates] = useState({ lat: null, lng: null });

    const config = useConfigStore();

    const street = watch('address.street');
    const city = watch('address.city');
    const zip = watch('address.zip');
    const latitude = watch('location.latitude');
    const longitude = watch('location.longitude');

    const locationNotFoundTranslation = t('srv_location_not_found');

    const fetchCoordinates = useCallback(async () => {
        setPostMsg('');
        if (!street || !city || !zip) {
            setPostMsg(new Error('srv_address_required'));
            return;
        }

        const address = `${street}, ${city}, ${zip}`;
        setSearchedLocation(address);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.googleMapsApiKey}`;
        try {
            const response = await axios.get(geocodeUrl);
            const data = response.data;

            if (data.status === "OK" && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                setSelectedPosition(location);
                setTempCoordinates({ lat: location.lat, lng: location.lng });
                setPostMsg('srv_coordinates_fetched');
            } else {
                setPostMsg(new Error(`${address} - ${locationNotFoundTranslation}`));
            }
        } catch {
            setPostMsg(new Error('srv_error_fetching_coordinates'));
        }
    }, [street, city, zip, config.googleMapsApiKey, locationNotFoundTranslation]);

    const handleGetCurrentLocation = () => {
        setPostMsg('');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setSelectedPosition({ lat: latitude, lng: longitude });
                    setTempCoordinates({ lat: latitude, lng: longitude });
                    setPostMsg('srv_location_fetched');
                },
                () => {
                    setPostMsg(t("srv_failed_to_get_location"));
                }
            );
        } else {
            setPostMsg(t("srv_geolocation_not_supported"));
        }
    };

    const handleReverseGeocoding = async (latitude, longitude) => {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.googleMapsApiKey}`;

        try {
            const response = await axios.get(geocodeUrl);
            const data = response.data;

            if (data.status === "OK" && data.results.length > 0) {
                const addressComponents = data.results[0].address_components;

                const route = addressComponents.find((component) => component.types.includes("route"))?.long_name || "";
                const streetNumber = addressComponents.find((component) => component.types.includes("street_number"))?.long_name || "";
                const sublocality = addressComponents.find((component) => component.types.includes("locality"))?.long_name || addressComponents.find((component) => component.types.includes("sublocality"))?.long_name || "";
                const neighborhood = addressComponents.find((component) => component.types.includes("neighborhood"))?.long_name || "";
                const postalCode = addressComponents.find((component) => component.types.includes("postal_code"))?.long_name || "";

                const street = `${route}${streetNumber ? ` ${streetNumber}` : ''}`;
                const city = `${sublocality}${neighborhood ? sublocality ? ` - ${neighborhood}` : `${neighborhood}` : ''}`;
                const zip = postalCode;

                setTempAddress({ street, city, zip });
                setTempCoordinates({ lat: latitude, lng: longitude });
                setPostMsg('srv_address_fetched');
            } else {
                setPostMsg(new Error('srv_invalid_coordinates'));
            }
        } catch (error) {
            console.log(error);
            setPostMsg(new Error('srv_error_fetching_address'));
        }
    };

    const handleMapClick = async (event) => {
        const latitude = Number(event.latLng.lat());
        const longitude = Number(event.latLng.lng());

        setSelectedPosition({ lat: latitude, lng: longitude });

        await handleReverseGeocoding(latitude, longitude);
    };

    const handleMarkerDragEnd = async (event) => {
        const latitude = Number(event.latLng.lat());
        const longitude = Number(event.latLng.lng());

        setSelectedPosition({ lat: latitude, lng: longitude });

        await handleReverseGeocoding(latitude, longitude);
    };

    const debouncedFetchCoordinates = useCallback(() => debounce(fetchCoordinates, 1000)(), [fetchCoordinates]);

    useEffect(() => {
        const currentAddress = `${street}, ${city}, ${zip}`;

        if (street && city && zip && searchedLocation !== currentAddress) {
            debouncedFetchCoordinates();
        }
    }, [street, city, zip, debouncedFetchCoordinates, searchedLocation]);

    const isButtonDisabled = searchedLocation === `${street}, ${city}, ${zip}`;

    const isApplyCoordinatesDisabled = !tempCoordinates.lat || !tempCoordinates.lng ||
        (Number(latitude) === Number(tempCoordinates.lat) && Number(longitude) === Number(tempCoordinates.lng));

    const isApplyAddressDisabled = (!tempAddress.street && !tempAddress.city && !tempAddress.zip) ||
        (street === tempAddress.street && city === tempAddress.city && zip === tempAddress.zip);

    const handleApplyCoordinates = () => {
        if (tempCoordinates.lat && tempCoordinates.lng) {
            setValue('location.latitude', tempCoordinates.lat);
            setValue('location.longitude', tempCoordinates.lng);
            setPostMsg(t('srv_coordinates_applied'));
        }
    };

    const handleApplyAddress = () => {
        if (tempAddress.street || tempAddress.city || tempAddress.zip) {
            setValue('address.street', tempAddress.street);
            setValue('address.city', tempAddress.city);
            setValue('address.zip', tempAddress.zip);
            setPostMsg(t('srv_address_applied'));
        }
    };

    return (
        <Stack spacing={2}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={18}
                center={selectedPosition}
                onClick={handleMapClick}
            >
                <MarkerF
                    position={selectedPosition}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                />
            </GoogleMap>

            <Stack spacing={1}>
                <Typography variant="body2"><b>{t('misc_fetched_coordinates')}:</b> {tempCoordinates.lat ? `${tempCoordinates.lat}, ${tempCoordinates.lng}` : '-'}</Typography>
                <Typography variant="body2"><b>{t('misc_fetched_address')}:</b> {tempAddress.street || tempAddress.city || tempAddress.zip ? `${tempAddress.street}, ${tempAddress.city}, ${tempAddress.zip}` : '-'}</Typography>
            </Stack>

            <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button disabled={isButtonDisabled} variant="contained" onClick={fetchCoordinates} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_fetch_coordinates')}
                </Button>
                <Button variant="contained" onClick={handleGetCurrentLocation} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_get_current_location')}
                </Button>
                <Button disabled={isApplyCoordinatesDisabled} variant="contained" color="success" onClick={handleApplyCoordinates} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_apply_coordinates')}
                </Button>
                <Button disabled={isApplyAddressDisabled} variant="contained" color="primary" onClick={handleApplyAddress} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_apply_address')}
                </Button>
            </Stack>

            {postMsg && <FeedbackMessage message={postMsg} />}
        </Stack>
    );
};

const LocationPicker = () => {
    const config = useConfigStore();
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: config.googleMapsApiKey,
    });

    if (loadError) return <Typography variant='body1' color='error'>{`Error loading Maps: ${loadError}`}</Typography>;
    if (!isLoaded) return <LoadingCircle />;

    return <GoogleMapPicker />;
};

export default LocationPicker;
