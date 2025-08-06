"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowUp, ArrowDown, X } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  category?: string;
  score?: number;
}

interface NextraSearchProps {
  pageMap?: any;
  placeholder?: string;
}

const NextraSearch: React.FC<NextraSearchProps> = ({
  pageMap,
  placeholder = "Search documentation...",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bms-search-history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (searchTerm: string) => {
    const updated = [
      searchTerm,
      ...searchHistory.filter((item) => item !== searchTerm),
    ].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem("bms-search-history", JSON.stringify(updated));
  };

  // Search function that works with Nextra pageMap
  const performSearch = async (
    searchQuery: string
  ): Promise<SearchResult[]> => {
    if (!pageMap) return [];

    const searchTerm = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    const searchInPage = (page: any, path: string = ""): void => {
      if (page.kind === "MdxPage" || page.kind === "Page") {
        const title = page.title || page.name || "";
        const content = page.content || "";
        const url = page.route || path;

        // Calculate relevance score
        let score = 0;
        const titleMatch = title.toLowerCase().includes(searchTerm);
        const contentMatch = content.toLowerCase().includes(searchTerm);

        if (titleMatch) score += 10;
        if (contentMatch) score += 5;
        if (title.toLowerCase().startsWith(searchTerm)) score += 5;

        if (score > 0) {
          results.push({
            title,
            url,
            content:
              content.substring(0, 150) + (content.length > 150 ? "..." : ""),
            score,
          });
        }
      }

      // Recursively search in children
      if (page.children) {
        page.children.forEach((child: any) => {
          searchInPage(child, page.route || path);
        });
      }
    };

    // Search through all pages
    Object.values(pageMap).forEach((page: any) => {
      searchInPage(page);
    });

    // Sort by relevance score and return top results
    return results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
  };

  // Debounced search effect
  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await performSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, pageMap]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case "Escape":
          handleClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    saveSearchHistory(query);
    router.push(result.url);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p>Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {result.content}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-400">
                          {result.url}
                        </span>
                        {result.score && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                            {result.score}%
                          </span>
                        )}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="ml-2 text-blue-500">
                        <ArrowUp className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          ) : searchHistory.length > 0 ? (
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((term, index) => (
                <div
                  key={index}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Search className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">{term}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default NextraSearch;
