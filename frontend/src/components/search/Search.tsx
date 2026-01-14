import { useEffect, useState } from 'react';
import './Search.css';
import Follow from '../follows/follow/Follow';
import Spinner from '../common/spinner/Spinner';
import useTitle from '../../hooks/use-title';
import useService from '../../hooks/use-service';
import SearchService from '../../services/auth-aware/SearchService';
import type User from '../../models/user';

export default function Search() {
    useTitle('Search');

    const searchService = useService(SearchService);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedQuery, setDebouncedQuery] = useState<string>('');
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    // Debounce search query - wait 300ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Perform search when debounced query changes
    useEffect(() => {
        const performSearch = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                setHasSearched(false);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setHasSearched(true);
                const searchResults = await searchService.searchUsers(debouncedQuery);
                setResults(searchResults);
            } catch (e) {
                alert(e);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery]);

    return (
        <div className='Search'>
            <div className="search-header">
                <h2>Search Users</h2>
                <p className="search-subtitle">Find users by name or username</p>
            </div>

            <div className="search-bar-container">
                <div className="search-bar">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search for users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {isLoading && (
                        <div className="search-spinner">
                            <Spinner />
                        </div>
                    )}
                </div>
            </div>

            {searchQuery.length > 0 && searchQuery.length < 2 && (
                <div className="search-hint">
                    <p>Type at least 2 characters to search</p>
                </div>
            )}

            {!hasSearched && searchQuery.length === 0 && (
                <div className="empty-state">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <p>Search for users by name or username</p>
                </div>
            )}

            {isLoading && debouncedQuery.length >= 2 && (
                <div className="search-loading">
                    <Spinner />
                    <p>Searching...</p>
                </div>
            )}

            {!isLoading && hasSearched && results.length > 0 && (
                <div className="search-results">
                    <h3 className="results-header">{results.length} {results.length === 1 ? 'result' : 'results'} found</h3>
                    <div className="results-list">
                        {results.map(user => (
                            <Follow
                                key={user.id}
                                user={user}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && hasSearched && debouncedQuery.length >= 2 && results.length === 0 && (
                <div className="empty-state">
                    <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <p>No users found</p>
                    <p className="empty-subtitle">Try a different search term</p>
                </div>
            )}
        </div>
    );
}
