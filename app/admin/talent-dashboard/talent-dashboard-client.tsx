"use client";

import { Search, MoreVertical, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Gig {
  id: number;
  gigId: number;
  title: string;
  company: string;
  location: string;
  appliedDate: string;
  status: string;
  image: string;
}

interface GigCategory {
  active: Gig[];
  accepted: Gig[];
  rejected: Gig[];
}

interface TalentDashboardClientProps {
  gigs: GigCategory;
}

export function TalentDashboardClient({ gigs }: TalentDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<keyof GigCategory>("active");

  const handleTabChange = (value: string) => {
    if (value === "active" || value === "accepted" || value === "rejected") {
      setActiveTab(value);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "shortlisted":
        return "bg-blue-100 text-blue-800";
      case "interview scheduled":
        return "bg-purple-100 text-purple-800";
      case "under review":
      case "new":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const activeApplications: Gig[] = gigs[activeTab] || [];

  return (
    <div>
      {/* Search and Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input placeholder="Search applications..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({gigs.active.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({gigs.accepted.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({gigs.rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                      <th className="py-3 px-6">Gig</th>
                      <th className="py-3 px-6">Applied</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeApplications.length > 0 ? (
                      activeApplications.map((application: Gig) => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                                <SafeImage
                                  src={application.image}
                                  alt={application.title}
                                  width={64}
                                  height={64}
                                  placeholderQuery="gig photo"
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div>
                                <Link
                                  href={`/gigs/${application.gigId}`}
                                  className="font-semibold text-black hover:underline"
                                >
                                  {application.title}
                                </Link>
                                <p className="text-gray-600">
                                  {application.company} - {application.location}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-600">{application.appliedDate}</td>
                          <td className="py-4 px-6">
                            <Badge className={`capitalize ${getStatusBadge(application.status)}`}>
                              {application.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-gray-500">
                          You have no {activeTab} applications yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
