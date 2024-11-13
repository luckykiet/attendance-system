import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Checkbox } from '@mui/material';
import PropTypes from 'prop-types';
import LoadingCircle from '@/components/LoadingCircle';

const ReactTable = ({
    columns,
    data,
    loading = false,
    order,
    orderBy,
    onRequestSort,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowKey = '_id',
    selected = [],
    onSelectAllClick,
    onRowClick,
}) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    const handleSort = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
                <TableContainer>
                    <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                        <TableHead>
                            <TableRow>
                                {onSelectAllClick && (
                                    <TableCell padding="checkbox">

                                        <Checkbox
                                            indeterminate={selected.length > 0 && selected.length < data.length}
                                            checked={data.length > 0 && selected.length === data.length}
                                            onChange={onSelectAllClick}
                                        />
                                    </TableCell>
                                )}
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.numeric ? 'right' : 'left'}
                                        sortDirection={orderBy === column.id ? order : false}
                                    >
                                        <TableSortLabel
                                            active={orderBy === column.id}
                                            direction={orderBy === column.id ? order : 'asc'}
                                            onClick={handleSort(column.id)}
                                        >
                                            {column.label}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (onSelectAllClick ? 1 : 0)} align="center">
                                        <LoadingCircle />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (onSelectAllClick ? 1 : 0)} align="center">
                                        No data available
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow
                                        key={row[rowKey]}
                                        hover
                                        onClick={() => onRowClick && onRowClick(row)}
                                    >
                                        {columns.map((column) => (
                                            <TableCell key={column.id} align={column.numeric ? 'right' : 'left'}>
                                                {row[column.id]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={columns.length + (onSelectAllClick ? 1 : 0)} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                />
            </Paper>
        </Box>
    );
};

ReactTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            numeric: PropTypes.bool,
        })
    ).isRequired,
    data: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    onRowsPerPageChange: PropTypes.func.isRequired,
    rowKey: PropTypes.string,
    selected: PropTypes.array,
    onSelectAllClick: PropTypes.func,
    onRowClick: PropTypes.func,
};

export default ReactTable;
