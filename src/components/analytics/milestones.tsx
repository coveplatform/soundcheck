"use client";

import { Trophy, Star, DollarSign, Music, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  completed: boolean;
  progress?: number;
  target?: number;
  color: string;
}

interface MilestonesProps {
  totalReviews: number;
  totalEarnings: number;
  totalTracks: number;
  highestScore: number;
}

export function Milestones({ totalReviews, totalEarnings, totalTracks, highestScore }: MilestonesProps) {
  const milestones: Milestone[] = [
    {
      id: "first_review",
      icon: Star,
      title: "First Review",
      description: "Received your first feedback",
      completed: totalReviews >= 1,
      color: "from-yellow-400 to-orange-400",
    },
    {
      id: "10_reviews",
      icon: TrendingUp,
      title: "10 Reviews",
      description: "Getting feedback momentum",
      completed: totalReviews >= 10,
      progress: Math.min(totalReviews, 10),
      target: 10,
      color: "from-blue-400 to-cyan-400",
    },
    {
      id: "50_reviews",
      icon: Trophy,
      title: "50 Reviews",
      description: "Serious about improvement",
      completed: totalReviews >= 50,
      progress: Math.min(totalReviews, 50),
      target: 50,
      color: "from-purple-400 to-pink-400",
    },
    {
      id: "100_reviews",
      icon: Sparkles,
      title: "100 Reviews",
      description: "Feedback master!",
      completed: totalReviews >= 100,
      progress: Math.min(totalReviews, 100),
      target: 100,
      color: "from-purple-500 to-green-400",
    },
    {
      id: "first_5_star",
      icon: Star,
      title: "Perfect Score",
      description: "Received a 5.0 review",
      completed: highestScore >= 5.0,
      color: "from-yellow-400 to-amber-400",
    },
    {
      id: "first_earnings",
      icon: DollarSign,
      title: "First Sale",
      description: "Earned from a track purchase",
      completed: totalEarnings > 0,
      color: "from-green-400 to-emerald-400",
    },
    {
      id: "100_earned",
      icon: DollarSign,
      title: "$100 Earned",
      description: "Revenue milestone",
      completed: totalEarnings >= 100,
      progress: Math.min(totalEarnings, 100),
      target: 100,
      color: "from-green-400 to-purple-500",
    },
    {
      id: "5_tracks",
      icon: Music,
      title: "5 Tracks",
      description: "Building a portfolio",
      completed: totalTracks >= 5,
      progress: Math.min(totalTracks, 5),
      target: 5,
      color: "from-indigo-400 to-purple-400",
    },
  ];

  const completedCount = milestones.filter(m => m.completed).length;
  const completionPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      <div className="bg-gradient-to-br from-lime-50 to-yellow-50 rounded-2xl p-6 border-2 border-lime-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-black/40 uppercase tracking-widest">Achievements</p>
            <p className="text-2xl font-black mt-1">
              {completedCount} of {milestones.length} unlocked
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white border-2 border-black flex items-center justify-center">
            <p className="text-xl font-black">{completionPercent}%</p>
          </div>
        </div>
        <div className="h-3 w-full bg-white rounded-full overflow-hidden border-2 border-black">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Milestone grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {milestones.map((milestone) => {
          const Icon = milestone.icon;
          const progressPercent = milestone.target
            ? Math.round(((milestone.progress || 0) / milestone.target) * 100)
            : 0;

          return (
            <div
              key={milestone.id}
              className={cn(
                "rounded-xl p-4 border-2 transition-all",
                milestone.completed
                  ? "bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white/50 border-black/10"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                    milestone.completed
                      ? `bg-gradient-to-br ${milestone.color}`
                      : "bg-black/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      milestone.completed ? "text-white" : "text-black/30"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-bold mb-0.5",
                      milestone.completed ? "text-black" : "text-black/40"
                    )}
                  >
                    {milestone.title}
                  </p>
                  <p className="text-xs text-black/50 mb-2">
                    {milestone.description}
                  </p>

                  {milestone.target && !milestone.completed && (
                    <div>
                      <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs font-mono text-black/40">
                        {milestone.progress} / {milestone.target}
                      </p>
                    </div>
                  )}

                  {milestone.completed && (
                    <div className="flex items-center gap-1 text-xs font-bold text-purple-700">
                      <span>✓</span>
                      <span>Unlocked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
