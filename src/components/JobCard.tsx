import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Building2, DollarSign, Briefcase, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { formatLocation } from "@/lib/utils";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  jobMode?: string;
  workAuthorization?: string[];
  skills?: string[];
  matchScore?: number;
  salaryPeriod?: string;
}

const visaReplacement: Record<string, string> = {
  "H1B": "Sponsorship Available",
  "GC": "Work Permit Holder",
  "USC": "Eligible to Work",
  "OPT-EAD": "Graduate Work Permission",
  "CPT-EAD": "Internship Work Permission",
};

const JobCard = ({
  id,
  title,
  company,
  location,
  salaryMin,
  salaryMax,
  jobType,
  jobMode,
  workAuthorization,
  skills,
  matchScore,
  salaryPeriod
}: JobCardProps) => {

  const replacedAuthorization =
    workAuthorization?.map((auth) => visaReplacement[auth] || auth) || [];

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-card border-border/50 hover:-translate-y-1 group relative overflow-hidden">
      {/* Match Score Badge */}
      {matchScore !== undefined && matchScore > 0 && (
        <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1.5 rounded-bl-lg font-semibold text-xs flex items-center gap-1 border-b border-l border-primary/20">
          <Percent className="h-3 w-3" /> {matchScore}% Match
        </div>
      )}

      <div className="space-y-4">
        <div className={matchScore ? "pr-20" : ""}>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" /> {company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {formatLocation(location)}
            </span>
          </div>
        </div>

        {(salaryMin || salaryMax) && (
          <div className="flex items-center gap-2 text-sm bg-success/10 rounded-lg p-2.5 w-fit">
            <span className="font-semibold text-success">
              ${salaryMin?.toLocaleString() || 0} - ${salaryMax?.toLocaleString() || 'Max'} / {
                salaryPeriod === 'Hourly' ? 'hour' : 
                salaryPeriod === 'Monthly' ? 'month' : 
                'year'
              }
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {jobType && (
            <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10">
              <Briefcase className="h-3 w-3 mr-1" /> {jobType}
            </Badge>
          )}
          {jobMode && (
            <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
              {jobMode}
            </Badge>
          )}
        </div>

        {replacedAuthorization.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {replacedAuthorization.slice(0, 3).map((auth) => (
              <Badge key={auth} variant="outline" className="text-xs border-accent/50 text-accent bg-accent/5">
                {auth}
              </Badge>
            ))}
            {replacedAuthorization.length > 3 && (
              <Badge variant="outline" className="text-xs border-accent/50 text-accent bg-accent/5">
                +{replacedAuthorization.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.slice(0, 5).map((skill) => (
              <Badge key={skill} className="text-[10px] bg-muted/50 text-muted-foreground hover:bg-muted font-normal border-0 px-2 py-0.5">
                {skill}
              </Badge>
            ))}
            {skills.length > 5 && (
              <span className="text-[10px] text-muted-foreground flex items-center pl-1">+{skills.length - 5}</span>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link to={`/jobs/${id}`}>
            <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md transition-all group-hover:shadow-lg">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
