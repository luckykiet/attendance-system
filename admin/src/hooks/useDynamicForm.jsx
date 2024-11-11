import { Controller, useFormContext } from 'react-hook-form';
import { Grid2, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, InputAdornment, FormControlLabel, FormLabel, RadioGroup, Radio } from '@mui/material';
import CopyButton from '@/components/admin/CopyButton';
import { Fragment } from 'react';

const useDynamicForm = ({ items, form }) => {
    const context = useFormContext();
    const { control, watch, handleSubmit, formState: { dirtyFields } } = form || context;
    return items.map((item) => {
        const {
            name,
            type,
            label,
            rules,
            options,
            disabledCondition,
            startAdornment,
            endAdornment,
            hasCopyButton,
            placeholder,
            formatValue,
            grid,
            classes,
            onChange,
        } = item;

        const isDirty = dirtyFields[name];

        const renderInput = (field, fieldState) => {
            const commonProps = {
                ...field,
                label,
                error: fieldState.invalid,
                helperText: fieldState.error?.message,
                placeholder,
                className: !fieldState.invalid && isDirty && classes?.modified ? classes.modified : undefined,
                value: formatValue ? formatValue(field.value) : field.value,
            };

            switch (type) {
                case 'text':
                case 'number':
                    return (
                        <TextField
                            {...commonProps}
                            type={type}
                            fullWidth
                            onChange={(e) => onChange ? onChange(e) : field.onChange(e.target.value)}
                            onBlur={handleSubmit}
                            disabled={disabledCondition?.(watch)}
                            slotProps={{
                                input:
                                {
                                    startAdornment: startAdornment ? (
                                        <InputAdornment position="start">
                                            {startAdornment}
                                        </InputAdornment>
                                    ) : null,
                                    endAdornment: endAdornment || hasCopyButton ? (
                                        <InputAdornment position="end">
                                            {endAdornment || <CopyButton value={watch(name)} />}
                                        </InputAdornment>
                                    ) : null,
                                },
                                inputLabel: {
                                    className: !fieldState.invalid && isDirty && classes?.labelModified ? classes.labelModified : undefined,
                                }
                            }}
                        />
                    );

                case 'select':
                    return (
                        <FormControl fullWidth error={fieldState.invalid}>
                            <InputLabel className={classes?.labelModified}>{label}</InputLabel>
                            <Select
                                {...field}
                                label={label}
                                onChange={(e) => onChange ? onChange(e) : field.onChange(e.target.value)}
                                onBlur={handleSubmit}
                                className={isDirty && classes?.selectModified ? classes.selectModified : undefined}
                                disabled={disabledCondition?.(watch)}
                            >
                                {options.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {fieldState.invalid && (
                                <FormHelperText>{fieldState.error?.message}</FormHelperText>
                            )}
                        </FormControl>
                    );

                case 'radio':
                    return (
                        <FormControl error={fieldState.invalid}>
                            <FormLabel className={classes?.labelModified}>{label}</FormLabel>
                            <RadioGroup
                                {...field}
                                onChange={(e) => onChange ? onChange(e) : field.onChange(e.target.value)}
                                value={field.value || ''}
                                row
                            >
                                {options.map((option) => (
                                    <FormControlLabel
                                        key={option.value}
                                        value={option.value}
                                        control={<Radio />}
                                        label={option.label}
                                    />
                                ))}
                            </RadioGroup>
                            {fieldState.invalid && (
                                <FormHelperText>{fieldState.error?.message}</FormHelperText>
                            )}
                        </FormControl>
                    );

                default:
                    return null;
            }
        };

        const inputElement = (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => renderInput(field, fieldState)}
            />
        );

        return grid ? (
            <Grid2 {...grid} key={name}>
                {inputElement}
            </Grid2>
        ) : (
            <Fragment key={name}>
                {inputElement}
            </Fragment>
        );
    });
};

export default useDynamicForm;