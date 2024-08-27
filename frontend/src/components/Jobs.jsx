import React from "react";
import Navbar from "./shared/Navbar";
import FilterCard from "./FilterCard";
import Job from "./Job";
import { Key } from "lucide-react";

const jobArray = [1, 23, 4, 5, 6, 7, 8];
const Jobs = () => {
  return (
    <div>
      <Navbar />

      <div className="max-w-7xl mt-5 mx-auto">
        <div className="flex gap-5">
          <div className="w-20%">
            <FilterCard />
          </div>

          {jobArray.length <= 0 ? (
            <span>Job Not Found</span>
          ) : (
            <div className="flex-1 h-[88vh] overflow-y-auto pb-5">
              <div className="grid grid-cols-3 gap-4">
                {jobArray.map((item, index) => (
                  <div key={index}>
                    <Job />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Jobs;
