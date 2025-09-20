"use client";

import { CheckSquare, FileText, Globe, Users } from "lucide-react";

interface GlobalSharing {
  allSharedChecklists: Array<{
    id: string;
    title: string;
    owner: string;
    sharedWith: string[];
    sharedAt: string;
    isPubliclyShared: boolean;
  }>;
  allSharedNotes: Array<{
    id: string;
    title: string;
    owner: string;
    sharedWith: string[];
    sharedAt: string;
    isPubliclyShared: boolean;
  }>;
  sharingStats: {
    totalSharedChecklists: number;
    totalSharedNotes: number;
    totalSharingRelationships: number;
    totalPublicShares: number;
    mostActiveSharers: Array<{
      username: string;
      sharedCount: number;
    }>;
  };
}

interface AdminSharingProps {
  globalSharing: GlobalSharing;
}

export function AdminSharing({ globalSharing }: AdminSharingProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Global Sharing Overview</h2>
        <div className="text-sm text-muted-foreground">
          {globalSharing.sharingStats?.totalSharingRelationships || 0} total
          sharing relationships
        </div>
      </div>

      {/* Sharing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Shared Checklists
              </p>
              <p className="text-2xl font-bold text-foreground">
                {globalSharing.sharingStats?.totalSharedChecklists || 0}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Shared Notes
              </p>
              <p className="text-2xl font-bold text-foreground">
                {globalSharing.sharingStats?.totalSharedNotes || 0}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Public Shares
              </p>
              <p className="text-2xl font-bold text-foreground">
                {globalSharing.sharingStats?.totalPublicShares || 0}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Shares
              </p>
              <p className="text-2xl font-bold text-foreground">
                {globalSharing.sharingStats?.totalSharingRelationships || 0}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Most Active Sharers */}
      {globalSharing.sharingStats?.mostActiveSharers?.length > 0 && (
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Most Active Sharers
          </h3>
          <div className="space-y-2">
            {globalSharing.sharingStats.mostActiveSharers.map(
              (sharer: any, index: number) => (
                <div
                  key={sharer.username}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium text-foreground">
                      {sharer.username}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sharer.sharedCount} item
                    {sharer.sharedCount !== 1 ? "s" : ""} shared
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* All Shared Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            All Shared Checklists (
            {globalSharing.allSharedChecklists?.length || 0})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {globalSharing.allSharedChecklists?.length > 0 ? (
              globalSharing.allSharedChecklists.map((item: any) => (
                <div
                  key={`${item.owner}-${item.id}`}
                  className="p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                      {item.isPubliclyShared && (
                        <div title="Publicly shared">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.sharedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {item.owner}
                  </p>
                  {item.isPubliclyShared ? (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <Globe className="h-3 w-3" />
                      <span>Publicly accessible</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {item.sharedWith.map((username: string) => (
                        <span
                          key={username}
                          className="inline-flex px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No shared checklists
              </p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Shared Notes ({globalSharing.allSharedNotes?.length || 0})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {globalSharing.allSharedNotes?.length > 0 ? (
              globalSharing.allSharedNotes.map((item: any) => (
                <div
                  key={`${item.owner}-${item.id}`}
                  className="p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {item.title}
                      </p>
                      {item.isPubliclyShared && (
                        <div title="Publicly shared">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.sharedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {item.owner}
                  </p>
                  {item.isPubliclyShared ? (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <Globe className="h-3 w-3" />
                      <span>Publicly accessible</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {item.sharedWith.map((username: string) => (
                        <span
                          key={username}
                          className="inline-flex px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No shared notes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
