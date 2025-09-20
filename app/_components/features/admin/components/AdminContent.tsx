"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Checklist, Note, User as UserType } from "@/app/_types";

interface AdminContentProps {
  allLists: Checklist[];
  allDocs: Note[];
  users: UserType[];
}

interface UserContent {
  user: UserType;
  checklists: Checklist[];
  notes: Note[];
  totalItems: number;
}

export function AdminContent({ allLists, allDocs, users }: AdminContentProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const sortedUserContent = useMemo(() => {
    const userContentMap = new Map<string, UserContent>();

    users.forEach((user) => {
      const userChecklists = allLists.filter(
        (list) => list.owner === user.username
      );
      const userNotes = allDocs.filter((doc) => doc.owner === user.username);

      userContentMap.set(user.username, {
        user,
        checklists: userChecklists,
        notes: userNotes,
        totalItems: userChecklists.length + userNotes.length,
      });
    });

    return Array.from(userContentMap.values()).sort(
      (a, b) => b.totalItems - a.totalItems
    );
  }, [users, allLists, allDocs]);

  useEffect(() => {
    if (!isInitialized && sortedUserContent.length > 0) {
      setExpandedUsers(
        new Set(sortedUserContent.map((uc) => uc.user.username))
      );
      setIsInitialized(true);
    }
  }, [sortedUserContent, isInitialized]);

  const toggleUser = (username: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(username)) {
      newExpanded.delete(username);
    } else {
      newExpanded.add(username);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleAll = () => {
    if (expandedUsers.size === sortedUserContent.length) {
      setExpandedUsers(new Set());
    } else {
      setExpandedUsers(
        new Set(sortedUserContent.map((uc) => uc.user.username))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Content</h2>
          <p className="text-muted-foreground">
            Content organized by user with sharing status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {allLists.length + allDocs.length} total items across {users.length}{" "}
            users
          </span>
          <button
            onClick={toggleAll}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            {expandedUsers.size === sortedUserContent.length
              ? "Collapse All"
              : "Expand All"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedUserContent.map((userContent) => {
          const isExpanded = expandedUsers.has(userContent.user.username);
          const hasContent = userContent.totalItems > 0;

          return (
            <div
              key={userContent.user.username}
              className="p-6 rounded-lg border border-border bg-card"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleUser(userContent.user.username)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {userContent.user.username}
                      </h3>
                      {userContent.user.isAdmin && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {userContent.checklists.length} checklists •{" "}
                      {userContent.notes.length} notes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasContent && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {userContent.totalItems} items
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border">
                  {hasContent ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          Checklists ({userContent.checklists.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {userContent.checklists.map((list) => (
                            <Link
                              key={list.id}
                              href={`/checklist/${list.id}`}
                              className="block p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground text-sm">
                                      {list.title}
                                    </p>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {list.category} • {list.items.length} items
                                  </p>
                                </div>
                                {list.isShared && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
                                    Shared
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Notes ({userContent.notes.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {userContent.notes.map((doc) => (
                            <Link
                              key={doc.id}
                              href={`/note/${doc.id}`}
                              className="block p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground text-sm">
                                      {doc.title}
                                    </p>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {doc.category} • {doc.content.length}{" "}
                                    characters
                                  </p>
                                </div>
                                {doc.isShared && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
                                    Shared
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No content yet
                      </h3>
                      <p className="text-muted-foreground">
                        This user hasn&apos;t created any checklists or notes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
