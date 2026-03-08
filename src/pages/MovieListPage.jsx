// src/pages/MovieListPage.jsx
import React, { useEffect, useState, useMemo } from "react";
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
  Input,
  Select,
  HStack,
  Box,
} from "@chakra-ui/react";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";

export default function MovieListPage() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAddedBy, setFilterAddedBy] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "added_at", direction: "desc" });

  const typeOptions = [
    "4K UHD",
    "A24",
    "Arrow",
    "Blu-ray",
    "Criterion",
    "DVD",
    "Kino Lorber",
    "Paramount",
    "Shout! Factory",
    "Steelbook",
  ];

  const addedByOptions = ["Sr", "Jr"];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching movies:", error);
    } else {
      setMovies(data || []);
    }
  };

  // Sorting helper
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filtered and sorted movies
  const displayedMovies = useMemo(() => {
    let filtered = [...movies];

    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterType) {
      filtered = filtered.filter((m) => m.type === filterType);
    }
    if (filterAddedBy) {
      filtered = filtered.filter((m) => m.added_by === filterAddedBy);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key] || "";
        let valB = b[sortConfig.key] || "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [movies, searchQuery, filterType, filterAddedBy, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />;
  };

  return (
    <Box>
      {/* Search and filters */}
      <HStack spacing={4} mb={4} flexWrap="wrap">
        <Input
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          maxW="250px"
        />
        <Select
          placeholder="Filter by type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          maxW="200px"
        >
          {typeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
        <Select
          placeholder="Filter by who added"
          value={filterAddedBy}
          onChange={(e) => setFilterAddedBy(e.target.value)}
          maxW="150px"
        >
          {addedByOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      </HStack>

      {/* Movie table */}
      <TableContainer bg="gray.800" borderRadius="md" p={2} overflowX="auto">
        <Table variant="simple" colorScheme="teal">
          <Thead>
            <Tr>
              <Th>Poster</Th>
              <Th cursor="pointer" onClick={() => requestSort("title")}>
                Title {getSortIcon("title")}
              </Th>
              <Th cursor="pointer" onClick={() => requestSort("year")}>
                Year {getSortIcon("year")}
              </Th>
              <Th cursor="pointer" onClick={() => requestSort("type")}>
                Type {getSortIcon("type")}
              </Th>
              <Th cursor="pointer" onClick={() => requestSort("added_by")}>
                Added By {getSortIcon("added_by")}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {displayedMovies.map((m) => (
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
                <Td>{m.type || "-"}</Td>
                <Td>{m.added_by || "-"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}