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
  const [filterFormat, setFilterFormat] = useState("");
  const [filterStudio, setFilterStudio] = useState("");

  const [sortConfig, setSortConfig] = useState([
    { key: "added_at", direction: "desc" },
  ]);

  const typeOptions = ["Steelbook", "Box Set"];

  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];

  const studioOptions = [
    "A24",
    "Arrow",
    "Criterion",
    "Kino Lorber",
    "Lionsgate",
    "Paramount",
    "Shout!",
    "Sony",
    "Universal",
    "Warner Bros",
  ];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setMovies(data || []);
    }
  };

  const requestSort = (key, event) => {
    const isShift = event.shiftKey;

    setSortConfig((prev) => {
      const existing = prev.find((s) => s.key === key);

      if (!isShift) {
        if (existing) {
          return [
            {
              key,
              direction: existing.direction === "asc" ? "desc" : "asc",
            },
          ];
        }

        return [{ key, direction: "asc" }];
      }

      if (existing) {
        return prev.map((s) =>
          s.key === key
            ? {
                ...s,
                direction: s.direction === "asc" ? "desc" : "asc",
              }
            : s
        );
      }

      return [...prev, { key, direction: "asc" }];
    });
  };

  const getSortIcon = (key) => {
    const sort = sortConfig.find((s) => s.key === key);
    if (!sort) return null;

    return sort.direction === "asc" ? (
      <TriangleUpIcon ml={1} />
    ) : (
      <TriangleDownIcon ml={1} />
    );
  };

  const displayedMovies = useMemo(() => {
    let filtered = [...movies];

    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterFormat) {
      filtered = filtered.filter((m) => m.format === filterFormat);
    }

    if (filterStudio) {
      filtered = filtered.filter((m) => m.studio === filterStudio);
    }

    if (filterType) {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    filtered.sort((a, b) => {
      for (const sort of sortConfig) {
        let valA = a[sort.key] || "";
        let valB = b[sort.key] || "";

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sort.direction === "asc" ? -1 : 1;
        if (valA > valB) return sort.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return filtered;
  }, [
    movies,
    searchQuery,
    filterType,
    filterFormat,
    filterStudio,
    sortConfig,
  ]);

  return (
    <Box>
      {/* FILTERS */}
      <HStack spacing={4} mb={4} flexWrap="wrap">
        <Input
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          maxW="250px"
        />

        <Select
          placeholder="Format"
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          maxW="140px"
        >
          {formatOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </Select>

        <Select
          placeholder="Studio"
          value={filterStudio}
          onChange={(e) => setFilterStudio(e.target.value)}
          maxW="180px"
        >
          {studioOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </Select>

        <Select
          placeholder="Type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          maxW="180px"
        >
          {typeOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </Select>
      </HStack>

      {/* TABLE */}
      <TableContainer bg="gray.800" borderRadius="md" p={2}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Poster</Th>

              <Th cursor="pointer" onClick={(e) => requestSort("title", e)}>
                Title {getSortIcon("title")}
              </Th>

              <Th cursor="pointer" onClick={(e) => requestSort("year", e)}>
                Year {getSortIcon("year")}
              </Th>

              <Th cursor="pointer" onClick={(e) => requestSort("format", e)}>
                Format {getSortIcon("format")}
              </Th>

              <Th cursor="pointer" onClick={(e) => requestSort("studio", e)}>
                Studio {getSortIcon("studio")}
              </Th>

              <Th cursor="pointer" onClick={(e) => requestSort("type", e)}>
                Type {getSortIcon("type")}
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
                <Td>{m.format || "-"}</Td>
                <Td>{m.studio || "-"}</Td>
                <Td>{m.type || "-"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}