import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import EditAddress from "./EditAddress";
import { AddressContentsInputType, CryptoAddress } from "../types";

export default function EditAddresses(props: {
  addresses: CryptoAddress;
  onUpdate: (params: AddressContentsInputType) => void;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Grid container>
      {editing != null ? (
        <EditAddress
          address={editing}
          contents={props.addresses[editing] || { name: "" }}
          onSave={(params) => {
            setEditing(null);
            props.onUpdate(params);
          }}
          // if editing length is 0, implies adding new entry
          isUpdatingExisting={editing.length > 0}
        />
      ) : (
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Address</TableCell>
                  <TableCell align="right">Name</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(props.addresses).map(([address, contents]) => (
                  <TableRow
                    key={address}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {address}
                    </TableCell>
                    <TableCell align="right">{contents.name}</TableCell>
                    <TableCell align="right">
                      <Button onClick={() => setEditing(address)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box m={1} />
          <Grid item xs={12} style={{ width: "100%" }}>
            <Button onClick={() => setEditing("")} variant="outlined">
              Add new
            </Button>
          </Grid>
          <Box m={1} />
          <Grid item xs={12} style={{ width: "100%" }}>
            <Button onClick={props.onDone} variant="outlined">
              Done editing
            </Button>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}
