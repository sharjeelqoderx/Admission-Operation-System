import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Here&apos;s your dashboard overview for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">3.8</div>
            <p className="text-xs text-muted-foreground mt-1">
              Excellent performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 unread
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest actions and course updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">Assignment Submitted</p>
                <p className="text-xs text-muted-foreground">
                  Data Structures - Linked Lists
                </p>
              </div>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">Grade Posted</p>
                <p className="text-xs text-muted-foreground">
                  Web Development - Midterm Exam
                </p>
              </div>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">New Announcement</p>
                <p className="text-xs text-muted-foreground">
                  Semester Timetable Updated
                </p>
              </div>
              <span className="text-xs text-muted-foreground">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Project Submission</span>
                <span className="text-red-600 font-medium">2 days</span>
              </li>
              <li className="flex justify-between">
                <span>Quiz 5</span>
                <span className="text-yellow-600 font-medium">5 days</span>
              </li>
              <li className="flex justify-between">
                <span>Final Project</span>
                <span className="text-green-600 font-medium">14 days</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              View Courses
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Submit Assignment
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Check Grades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
