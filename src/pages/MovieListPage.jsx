// src/pages/MovieListPage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Image,
} from "@chakra-ui/react";

export default function MovieListPage() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("added_at", { ascending: false }); // Make sure column exists

    if (error) {
      console.error("Error fetching movies:", error);
    } else {
      console.log("Fetched movies:", data);
      setMovies(data || []);
    }
  };

  return (
    <TableContainer bg="gray.800" borderRadius="md" p={2}>
      <Table variant="simple" colorScheme="teal">
        <Thead>
          <Tr>
            <Th>Poster</Th>
            <Th>Title</Th>
            <Th>Year</Th>
            <Th>Distributor</Th>
            <Th>Added By</Th>
            {/* <Th>Added At</Th> */}
          </Tr>
        </Thead>
        <Tbody>
          {movies.map((m) => (
            <Tr key={m.id}>
              <Td>
                {m.poster_url ? (
                  <Image
                    src={m.poster_url}
                    alt={m.title}
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                ) : (
                  "-"
                )}
              </Td>
              <Td>{m.title}</Td>
              <Td>{m.year || "-"}</Td>
              <Td>{m.distributor || "-"}</Td>
              <Td>{m.added_by || "-"}</Td>
              {/* <Td>{m.added_at ? new Date(m.added_at).toLocaleString() : "-"}</Td> */}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}