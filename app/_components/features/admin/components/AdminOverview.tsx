"use client";

import { Users, FileText, CheckSquare, Shield, Share2 } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalChecklists: number;
  totalNotes: number;
  sharedChecklists: number;
  sharedNotes: number;
  totalSharingRelationships: number;
  adminUsers: number;
}

interface AdminOverviewProps {
  stats: AdminStats;
}

export function AdminOverview({ stats }: AdminOverviewProps) {
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: "Admin Users",
      value: stats.adminUsers,
      icon: Shield,
    },
    {
      title: "Total Checklists",
      value: stats.totalChecklists,
      icon: CheckSquare,
    },
    {
      title: "Total Notes",
      value: stats.totalNotes,
      icon: FileText,
    },
    {
      title: "Shared Checklists",
      value: stats.sharedChecklists,
      icon: CheckSquare,
    },
    {
      title: "Shared Notes",
      value: stats.sharedNotes,
      icon: FileText,
    },
    {
      title: "Total Shares",
      value: stats.totalSharingRelationships,
      icon: Share2,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          System Overview
        </h2>
        <p className="text-muted-foreground">
          Monitor your application&apos;s usage and user activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="p-6 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            User Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Regular Users</span>
              <span className="font-medium">
                {stats.totalUsers - stats.adminUsers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Admin Users</span>
              <span className="font-medium">{stats.adminUsers}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${(stats.adminUsers / stats.totalUsers) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Content Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Content</span>
              <span className="font-medium">
                {stats.totalChecklists + stats.totalNotes}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Shared Items</span>
              <span className="font-medium">
                {stats.sharedChecklists + stats.sharedNotes}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sharing Relationships</span>
              <span className="font-medium">
                {stats.totalSharingRelationships}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${((stats.sharedChecklists + stats.sharedNotes) /
                      (stats.totalChecklists + stats.totalNotes)) *
                    100
                    }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
