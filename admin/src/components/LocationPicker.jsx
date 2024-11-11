import { useState } from 'react';
import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api';
import { useFormContext } from 'react-hook-form';
import { Button, Stack } from '@mui/material';
import axios from 'axios';
import { CONFIG } from '@/configs';
import useTranslation from '@/hooks/useTranslation';
import FeedbackMessage from './FeedbackMessage';

const mapContainerStyle = {
    width: '100%',
    height: '300px',
};

const defaultCenter = {
    lat: 50.073658, // Prague
    lng: 14.418540,
};

function LocationPicker() {
    const { t } = useTranslation();
    const { setValue, getValues } = useFormContext();
    const [selectedPosition, setSelectedPosition] = useState(defaultCenter);
    const [postMsg, setPostMsg] = useState('');

    const fetchCoordinates = async () => {
        const { street, city, zip } = getValues('address');

        if (!street || !city || !zip) {
            throw new Error("misc_adddress_required");
        }

        const address = `${street}, ${city}, ${zip}`;
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`;

        try {
            const response = await axios.get(geocodeUrl);
            const data = response.data;

            if (data.status === "OK" && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                setSelectedPosition(location);
                setValue('location.latitude', location.lat);
                setValue('location.longitude', location.lng);
            } else {
                throw new Error("misc_invalid_address");
            }
        } catch (error) {
            setPostMsg(error)
        }
    };

    const handleMapClick = (event) => {
        const latitude = event.latLng.lat();
        const longitude = event.latLng.lng();

        setSelectedPosition({ lat: latitude, lng: longitude });
        setValue('location.latitude', latitude);
        setValue('location.longitude', longitude);
    };

    const handleMarkerDragEnd = (event) => {
        const latitude = event.latLng.lat();
        const longitude = event.latLng.lng();

        setSelectedPosition({ lat: latitude, lng: longitude });
        setValue('location.latitude', latitude);
        setValue('location.longitude', longitude);
    };

    return (
        <LoadScript googleMapsApiKey={CONFIG.GOOGLE_MAPS_API_KEY}>
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
                <Button variant="contained" onClick={fetchCoordinates} sx={{ mt: 1, mb: 2 }}>
                    {t('misc_fetch_coordinates')}
                </Button>
                {postMsg && <FeedbackMessage message={postMsg} />}
            </Stack>
        </LoadScript>
    );
}

export default LocationPicker;