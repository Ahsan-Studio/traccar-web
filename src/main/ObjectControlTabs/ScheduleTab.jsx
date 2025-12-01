import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CustomButton, CustomCheckbox } from "../../common/components/custom";

const ScheduleTab = ({ classes }) => {
  return (
    <div className={classes.tabPanel}>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>
                <CustomCheckbox />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Gateway</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Command</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className={classes.emptyState}>
                No scheduled commands
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={2}>
        <CustomButton
          variant="contained"
          color="primary"
          icon={<AddIcon />}
          iconPosition="left"
          size="small"
        >
          Add Schedule
        </CustomButton>
      </Box>
    </div>
  );
};

export default ScheduleTab;
