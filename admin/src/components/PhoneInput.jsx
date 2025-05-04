import { MuiTelInput } from 'mui-tel-input';
import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

const PhoneInput = ({ initValue = '', onChange, error = false, helperText }) => {
    const [value, setValue] = useState(initValue);

    const debouncedOnChange = useMemo(() => _.debounce(onChange, 400), [onChange]);

    const handleChange = (newValue, info) => {
        setValue(newValue);
        debouncedOnChange(`+${info.countryCallingCode} ${info.nationalNumber}`);
    };

    useEffect(() => {
        return () => {
            debouncedOnChange.cancel();
        };
    }, [debouncedOnChange]);

    useEffect(() => {
        setValue(initValue || '');
    }, [initValue]);

    return (
        <MuiTelInput
            forceCallingCode
            focusOnSelectCountry
            defaultCountry="CZ"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={helperText}
        />
    );
};

PhoneInput.propTypes = {
    initValue: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.bool,
    helperText: PropTypes.string,
};

export default PhoneInput;
