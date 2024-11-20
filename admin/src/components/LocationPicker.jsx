import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import { useFormContext } from 'react-hook-form';
import { Button, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { CONFIG } from '@/configs';
import useTranslation from '@/hooks/useTranslation';
import FeedbackMessage from './FeedbackMessage';
import LoadingCircle from './LoadingCircle';

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


    const street = watch('address.street');
    const city = watch('address.city');
    const zip = watch('address.zip');

    const fetchCoordinates = useCallback(async () => {
        setPostMsg('');
        if (!street || !city || !zip) {
            setPostMsg(t("srv_address_required"));
            return;
        }

        const address = `${street}, ${city}, ${zip}`;
        setSearchedLocation(address);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`;

        try {
            const response = await axios.get(geocodeUrl);
            const data = response.data;

            if (data.status === "OK" && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                setSelectedPosition(location);
                setValue('location.latitude', Number(location.lat));
                setValue('location.longitude', Number(location.lng));
            } else {
                setPostMsg(t("srv_invalid_address"));
            }
        } catch {
            setPostMsg(t("srv_error_fetching_coordinates"));
        }
    }, [city, setValue, street, zip, t]);

    const handleGetCurrentLocation = () => {
        setPostMsg('');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setSelectedPosition({ lat: latitude, lng: longitude });
                    setValue('location.latitude', latitude);
                    setValue('location.longitude', longitude);
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
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`;

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

                setValue('address.street', street);
                setValue('address.city', city);
                setValue('address.zip', zip);
                setPostMsg(t("srv_address_updated"));
            } else {
                setPostMsg(t("srv_invalid_coordinates"));
            }
        } catch (error) {
            console.log(error)
            setPostMsg(t("srv_error_fetching_address"));
        }
    };

    const handleMapClick = async (event) => {
        const latitude = Number(event.latLng.lat());
        const longitude = Number(event.latLng.lng());

        setSelectedPosition({ lat: latitude, lng: longitude });
        setValue('location.latitude', latitude);
        setValue('location.longitude', longitude);

        await handleReverseGeocoding(latitude, longitude);
    };

    const handleMarkerDragEnd = async (event) => {
        const latitude = Number(event.latLng.lat());
        const longitude = Number(event.latLng.lng());

        setSelectedPosition({ lat: latitude, lng: longitude });
        setValue('location.latitude', latitude);
        setValue('location.longitude', longitude);

        await handleReverseGeocoding(latitude, longitude);
    };


    useEffect(() => {
        if (!selectedPosition && street && city && zip && searchedLocation !== `${street}, ${city}, ${zip}`) {
            fetchCoordinates();
        }
    }, [city, fetchCoordinates, searchedLocation, selectedPosition, street, zip]);

    const isButtonDisabled = searchedLocation === `${street}, ${city}, ${zip}`;

    return (
        <Stack spacing={2}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={12}
                center={selectedPosition}
                onClick={handleMapClick}
            >
                <MarkerF
                    position={selectedPosition}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                />
            </GoogleMap>
            <Stack direction='row' spacing={2}>
                <Button disabled={isButtonDisabled} variant="contained" onClick={fetchCoordinates} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_fetch_coordinates')}
                </Button>
                <Button variant="contained" onClick={handleGetCurrentLocation} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_get_current_location')}
                </Button>
            </Stack>
            {postMsg && <FeedbackMessage message={postMsg} />}
        </Stack>
    );
}

const LocationPicker = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: CONFIG.GOOGLE_MAPS_API_KEY,
    });

    if (loadError) return <Typography variant='body1' color='error'>{`Error loading Maps: ${loadError}`}</Typography>;
    if (!isLoaded) return <LoadingCircle />;

    return <GoogleMapPicker />;
};

export default LocationPicker;
