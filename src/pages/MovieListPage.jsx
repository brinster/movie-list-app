// src/pages/MovieListPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Box, Input, Select, HStack, Image, Text,
} from "@chakra-ui/react";
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import PosterCollage from "../components/PosterCollage";

export default function MovieListPage() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterStudio, setFilterStudio] = useState("");
  const [sortConfig, setSortConfig] = useState([{ key: "added_at", direction: "desc" }]);

  const typeOptions = ["Steelbook", "Box Set", "None"];
  const formatOptions = ["4K + BD", "4K", "BD", "DVD"];
  const studioOptions = [
    "A24", "Arrow", "Criterion", "Kino Lorber", "Lionsgate",
    "Paramount", "Shout!", "Sony", "Universal", "Warner Bros", "None",
  ];

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    const { data, error } = await supabase
      .from("movies").select("*").order("added_at", { ascending: false });
    if (error) console.error(error);
    else setMovies(data || []);
  };

  const requestSort = (key, event) => {
    const isShift = event.shiftKey;
    setSortConfig((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!isShift) {
        if (existing) return [{ key, direction: existing.direction === "asc" ? "desc" : "asc" }];
        return [{ key, direction: "asc" }];
      }
      if (existing) {
        return prev.map((s) =>
          s.key === key ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" } : s
        );
      }
      return [...prev, { key, direction: "asc" }];
    });
  };

  const getSortIcon = (key) => {
    const sort = sortConfig.find((s) => s.key === key);
    if (!sort) return null;
    return sort.direction === "asc"
      ? <TriangleUpIcon ml={1} boxSize="9px" opacity={0.7} />
      : <TriangleDownIcon ml={1} boxSize="9px" opacity={0.7} />;
  };

  const displayedMovies = useMemo(() => {
    let filtered = [...movies];
    if (searchQuery) filtered = filtered.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterFormat) filtered = filtered.filter((m) => (filterFormat === "None" ? !m.format : m.format === filterFormat));
    if (filterStudio) filtered = filtered.filter((m) => (filterStudio === "None" ? !m.studio : m.studio === filterStudio));
    if (filterType) filtered = filtered.filter((m) => (filterType === "None" ? !m.type : m.type === filterType));

    filtered.sort((a, b) => {
      for (const sort of sortConfig) {
        let valA = a[sort.key] ?? "";
        let valB = b[sort.key] ?? "";
        if (sort.key === "added_at") {
          const diff = new Date(valA) - new Date(valB);
          if (diff !== 0) return sort.direction === "asc" ? diff : -diff;
          continue;
        }
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sort.direction === "asc" ? -1 : 1;
        if (valA > valB) return sort.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [movies, searchQuery, filterType, filterFormat, filterStudio, sortConfig]);

  const controlStyle = {
    bg: "gray.700",
    border: "1px solid",
    borderColor: "whiteAlpha.100",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    _placeholder: { color: "whiteAlpha.400" },
    _focus: { borderColor: "teal.400", boxShadow: "0 0 0 1px var(--chakra-colors-teal-400)" },
  };

  return (
    <Box position="relative" zIndex={1} isolation="isolate">
      <PosterCollage movies={movies} />

      <Box
        bg="gray.800"
        borderRadius="12px"
        overflow="hidden"
        style={{
          boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 24px rgba(0,0,0,0.35)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Filter bar */}
        <Box px={4} py={3} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <HStack spacing={2} flexWrap="wrap">
            <Input
              placeholder="Search titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxW="200px"
              size="sm"
              h="34px"
              {...controlStyle}
            />
            {[
              { placeholder: "Format", value: filterFormat, onChange: setFilterFormat, options: formatOptions, maxW: "115px" },
              { placeholder: "Studio", value: filterStudio, onChange: setFilterStudio, options: studioOptions, maxW: "155px" },
              { placeholder: "Type",   value: filterType,   onChange: setFilterType,   options: typeOptions,   maxW: "130px" },
            ].map(({ placeholder, value, onChange, options, maxW }) => (
              <Select
                key={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                maxW={maxW}
                size="sm"
                h="34px"
                {...controlStyle}
              >
                {options.map((opt) => (
                  <option key={opt} style={{ background: "#2d3748" }}>{opt}</option>
                ))}
              </Select>
            ))}
            {(searchQuery || filterFormat || filterStudio || filterType) && (
              <Text
                fontSize="12px"
                color="whiteAlpha.500"
                cursor="pointer"
                userSelect="none"
                px={1}
                onClick={() => { setSearchQuery(""); setFilterFormat(""); setFilterStudio(""); setFilterType(""); }}
                _hover={{ color: "whiteAlpha.800" }}
                transition="color 0.15s"
              >
                Clear ✕
              </Text>
            )}
          </HStack>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table variant="unstyled" size="sm">
            <Thead>
              <Tr borderBottom="1px solid" borderColor="whiteAlpha.100">
                {[
                  { label: "Poster", key: null },
                  { label: "Title",  key: "title" },
                  { label: "Year",   key: "year" },
                  { label: "Format", key: "format" },
                  { label: "Studio", key: "studio" },
                  { label: "Type",   key: "type" },
                ].map(({ label, key }) => (
                  <Th
                    key={label}
                    onClick={key ? (e) => requestSort(key, e) : undefined}
                    cursor={key ? "pointer" : "default"}
                    userSelect="none"
                    color="whiteAlpha.400"
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    py={3}
                    px={4}
                    _hover={key ? { color: "whiteAlpha.700" } : {}}
                    transition="color 0.15s"
                  >
                    {label}{key && getSortIcon(key)}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {displayedMovies.map((m) => (
                <Tr
                  key={m.id}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.50"
                  _hover={{ bg: "whiteAlpha.50" }}
                  transition="background 0.12s"
                >
                  <Td px={4} py={2}>
                    {m.poster_url
                      ? <Image src={m.poster_url} alt={m.title} w="34px" h="50px" objectFit="cover" borderRadius="5px" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
                      : <Box w="34px" h="50px" borderRadius="5px" bg="whiteAlpha.100" />}
                  </Td>
                  <Td px={4} py={2} color="white" fontSize="13px" fontWeight="500">{m.title}</Td>
                  <Td px={4} py={2} color="whiteAlpha.500" fontSize="13px">{m.year || "—"}</Td>
                  <Td px={4} py={2}>
                    {m.format
                      ? <Box as="span" bg="teal.900" color="teal.200" fontSize="11px" fontWeight="700" letterSpacing="0.06em" px={2} py="2px" borderRadius="5px" border="1px solid" borderColor="teal.700">{m.format}</Box>
                      : <Text color="whiteAlpha.300" fontSize="13px">—</Text>}
                  </Td>
                  <Td px={4} py={2} color="whiteAlpha.500" fontSize="13px">{m.studio || "—"}</Td>
                  <Td px={4} py={2}>
                    {m.type
                      ? <Box as="span" bg="whiteAlpha.100" color="whiteAlpha.700" fontSize="11px" fontWeight="600" letterSpacing="0.04em" px={2} py="2px" borderRadius="5px" border="1px solid" borderColor="whiteAlpha.200">{m.type}</Box>
                      : <Text color="whiteAlpha.300" fontSize="13px">—</Text>}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Box px={4} py={2} borderTop="1px solid" borderColor="whiteAlpha.100">
          <Text fontSize="11px" color="whiteAlpha.300" letterSpacing="0.04em">
            {displayedMovies.length} {displayedMovies.length === 1 ? "title" : "titles"}
            {displayedMovies.length !== movies.length && ` of ${movies.length}`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
