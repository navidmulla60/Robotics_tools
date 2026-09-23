'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PackageUploader, { type PackageSlots } from './PackageUploader';
import GenerateConfigPanel from './GenerateConfigPanel';
import IssuesList from './IssuesList';
import { lintUrdf } from '@/lib/urdf/lint';
import { adaptLintIssues } from '@/lib/moveit/adaptLintIssues';
import { parseUrdfSummary } from '@/lib/moveit/parseUrdfSummary';
import { parseSrdf } from '@/lib/moveit/parseSrdf';
import { parseJointLimitsYaml } from '@/lib/moveit/parseJointLimits';
import { parseMoveitControllersYaml } from '@/lib/moveit/parseMoveitControllers';
import { parseKinematicsYaml } from '@/lib/moveit/parseKinematics';
import { parseInitialPositionsYaml } from '@/lib/moveit/parseInitialPositions';
import { parseRos2ControllersYaml } from '@/lib/moveit/parseRos2Controllers';
import { checkSetupAssistantReadiness, lintMoveitUrdf } from '@/lib/moveit/lintMoveit';
import {
  crossValidateSrdf,
  crossValidateJointLimits,
  crossValidateMoveitControllers,
  crossValidateKinematics,
  crossValidateInitialPositions,
  crossValidateRos2Controllers,
} from '@/lib/moveit/crossValidate';
import type { MoveitIssue } from '@/lib/moveit/types';

const EMPTY_SLOTS: PackageSlots = {
  urdf: null,
  srdf: null,
  jointLimits: null,
  controllers: null,
  kinematics: null,
  initialPositions: null,
  ros2Controllers: null,
  cartesianLimits: null,
};

function NeedsUrdfNote() {
  return <p className="text-sm text-neutral-500">Add a URDF above to cross-check this file&apos;s references.</p>;
}

export default function MoveitConfigHelperApp() {
  const [slots, setSlots] = useState<PackageSlots>(EMPTY_SLOTS);
  const [extraFiles, setExtraFiles] = useState({ extraUrdfNames: [] as string[], xacroNames: [] as string[], unmatchedNames: [] as string[] });

  const urdfText = slots.urdf?.text ?? '';
  const srdfText = slots.srdf?.text ?? '';
  const jointLimitsText = slots.jointLimits?.text ?? '';
  const controllersText = slots.controllers?.text ?? '';
  const kinematicsText = slots.kinematics?.text ?? '';
  const initialPositionsText = slots.initialPositions?.text ?? '';
  const ros2ControllersText = slots.ros2Controllers?.text ?? '';

  const anyLoaded = Object.values(slots).some(Boolean);

  const genericUrdfIssues = useMemo(() => (urdfText.trim() ? lintUrdf(urdfText) : []), [urdfText]);
  const urdfSummary = useMemo(() => (urdfText.trim() ? parseUrdfSummary(urdfText) : null), [urdfText]);
  const genericIssueIds = useMemo(() => new Set(genericUrdfIssues.map((i) => i.id)), [genericUrdfIssues]);

  const readinessIssues = useMemo(
    () => (urdfText.trim() ? checkSetupAssistantReadiness(urdfText, genericIssueIds) : []),
    [urdfText, genericIssueIds],
  );
  const moveitUrdfIssues = useMemo(() => (urdfSummary ? lintMoveitUrdf(urdfSummary) : []), [urdfSummary]);
  const urdfIssues = useMemo(() => adaptLintIssues(genericUrdfIssues), [genericUrdfIssues]);

  const srdfData = useMemo(() => (srdfText.trim() ? parseSrdf(srdfText) : null), [srdfText]);
  const srdfCrossIssues: MoveitIssue[] | null = useMemo(() => {
    if (!srdfData) return null;
    if (srdfData.parseError) return [{ id: 'srdf-parse-error', severity: 'error', source: 'srdf', message: srdfData.parseError }];
    if (!urdfSummary) return null;
    return crossValidateSrdf(urdfSummary, srdfData);
  }, [srdfData, urdfSummary]);

  const jointLimitsData = useMemo(() => (jointLimitsText.trim() ? parseJointLimitsYaml(jointLimitsText) : null), [jointLimitsText]);
  const jointLimitsIssues: MoveitIssue[] | null = useMemo(() => {
    if (!jointLimitsData) return null;
    if (jointLimitsData.parseError) return [{ id: 'jointlimits-parse-error', severity: 'error', source: 'joint_limits', message: jointLimitsData.parseError }];
    if (!urdfSummary) return null;
    return crossValidateJointLimits(urdfSummary, jointLimitsData);
  }, [jointLimitsData, urdfSummary]);

  const controllersData = useMemo(() => (controllersText.trim() ? parseMoveitControllersYaml(controllersText) : null), [controllersText]);
  const controllersIssues: MoveitIssue[] | null = useMemo(() => {
    if (!controllersData) return null;
    if (controllersData.parseError) return [{ id: 'controllers-parse-error', severity: 'error', source: 'cross', message: controllersData.parseError }];
    if (!urdfSummary) return null;
    return crossValidateMoveitControllers(urdfSummary, controllersData);
  }, [controllersData, urdfSummary]);

  const kinematicsData = useMemo(() => (kinematicsText.trim() ? parseKinematicsYaml(kinematicsText) : null), [kinematicsText]);
  const kinematicsIssues: MoveitIssue[] | null = useMemo(() => {
    if (!kinematicsData) return null;
    if (kinematicsData.parseError) return [{ id: 'kinematics-parse-error', severity: 'error', source: 'cross', message: kinematicsData.parseError }];
    if (!srdfData || srdfData.parseError) return null;
    return crossValidateKinematics(srdfData, kinematicsData);
  }, [kinematicsData, srdfData]);

  const initialPositionsData = useMemo(() => (initialPositionsText.trim() ? parseInitialPositionsYaml(initialPositionsText) : null), [initialPositionsText]);
  const initialPositionsIssues: MoveitIssue[] | null = useMemo(() => {
    if (!initialPositionsData) return null;
    if (initialPositionsData.parseError) return [{ id: 'initialpositions-parse-error', severity: 'error', source: 'cross', message: initialPositionsData.parseError }];
    if (!urdfSummary) return null;
    return crossValidateInitialPositions(urdfSummary, initialPositionsData);
  }, [initialPositionsData, urdfSummary]);

  const ros2ControllersData = useMemo(() => (ros2ControllersText.trim() ? parseRos2ControllersYaml(ros2ControllersText) : null), [ros2ControllersText]);
  const ros2ControllersIssues: MoveitIssue[] | null = useMemo(() => {
    if (!ros2ControllersData) return null;
    if (ros2ControllersData.parseError) return [{ id: 'ros2controllers-parse-error', severity: 'error', source: 'cross', message: ros2ControllersData.parseError }];
    if (!urdfSummary) return null;
    return crossValidateRos2Controllers(urdfSummary, ros2ControllersData);
  }, [ros2ControllersData, urdfSummary]);

  const readinessBlockers = readinessIssues.filter((i) => i.severity === 'error');

  const totalErrors =
    urdfIssues.filter((i) => i.severity === 'error').length +
    readinessIssues.filter((i) => i.severity === 'error').length +
    [srdfCrossIssues, jointLimitsIssues, controllersIssues, kinematicsIssues, initialPositionsIssues, ros2ControllersIssues]
      .flatMap((x) => x ?? [])
      .filter((i) => i.severity === 'error').length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">Upload your moveit_config package</h2>
          <p className="mb-3 text-xs text-neutral-500">
            The folder (or .zip) MoveIt Setup Assistant generated for you &mdash; its config files get checked against each
            other and, where you provide one, against a URDF.
          </p>
          <PackageUploader
            slots={slots}
            onSlotsChange={setSlots}
            extraUrdfNames={extraFiles.extraUrdfNames}
            xacroNames={extraFiles.xacroNames}
            unmatchedNames={extraFiles.unmatchedNames}
            onExtraFiles={setExtraFiles}
          />
        </div>

        {urdfSummary && !slots.srdf && (
          <GenerateConfigPanel
            urdf={urdfSummary}
            robotNameDefault="my_robot"
            onGenerated={(g) => setSlots((prev) => ({ ...prev, ...g }))}
          />
        )}

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          <p>
            Want to see this robot rendered, drive its joints, or check its TF tree first? Use the{' '}
            <Link href="/tools/urdf-visualizer" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              URDF Visualizer
            </Link>{' '}
            &mdash; this tool focuses on the checks specific to a MoveIt config (SRDF, joint limits, controllers), not 3D rendering.
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
        {!anyLoaded ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            Upload your package to get started. Everything here is optional on its own — the more you add, the more gets
            cross-checked; a URDF in particular unlocks most of it.
          </div>
        ) : (
          <>
            {readinessBlockers.length > 0 && (
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
                <h2 className="mb-2 text-sm font-bold text-red-800 dark:text-red-300">
                  Setup Assistant will likely crash on this URDF
                </h2>
                <IssuesList issues={readinessBlockers} emptyText="" />
              </div>
            )}

            {urdfText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">URDF checks</h2>
                  <span className="text-xs text-neutral-400">{urdfSummary?.linkNames.length ?? 0} links &middot; {urdfSummary?.joints.length ?? 0} joints</span>
                </div>
                <IssuesList
                  issues={[...urdfIssues, ...readinessIssues.filter((i) => i.severity !== 'error'), ...moveitUrdfIssues]}
                  emptyText="No issues found — this URDF looks ready for Setup Assistant."
                />
              </div>
            )}

            {srdfText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">SRDF checks</h2>
                  <span className="text-xs text-neutral-400">{srdfData?.groups.length ?? 0} group(s)</span>
                </div>
                {srdfCrossIssues === null ? <NeedsUrdfNote /> : <IssuesList issues={srdfCrossIssues} emptyText="No issues found — every SRDF reference resolves against this URDF." />}
              </div>
            )}

            {jointLimitsText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">joint_limits.yaml checks</h2>
                {jointLimitsIssues === null ? <NeedsUrdfNote /> : <IssuesList issues={jointLimitsIssues} emptyText="No issues found." />}
              </div>
            )}

            {controllersText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">moveit_controllers.yaml checks</h2>
                {controllersIssues === null ? <NeedsUrdfNote /> : <IssuesList issues={controllersIssues} emptyText="No issues found." />}
              </div>
            )}

            {kinematicsText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">kinematics.yaml checks</h2>
                {kinematicsIssues === null ? (
                  <p className="text-sm text-neutral-500">Add an SRDF above to cross-check this file&apos;s group names.</p>
                ) : (
                  <IssuesList issues={kinematicsIssues} emptyText="No issues found." />
                )}
              </div>
            )}

            {initialPositionsText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">initial_positions.yaml checks</h2>
                {initialPositionsIssues === null ? <NeedsUrdfNote /> : <IssuesList issues={initialPositionsIssues} emptyText="No issues found." />}
              </div>
            )}

            {ros2ControllersText.trim() && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">ros2_controllers.yaml checks</h2>
                {ros2ControllersIssues === null ? <NeedsUrdfNote /> : <IssuesList issues={ros2ControllersIssues} emptyText="No issues found." />}
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              <p className="font-medium">After Setup Assistant generates your package:</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>
                  Skim through <span className="font-mono">config/*.yaml</span> for bare-integer numeric values (
                  <span className="font-mono">5</span> instead of <span className="font-mono">5.0</span>) &mdash; ROS 2&apos;s
                  parameter loader infers type from the YAML literal, and mixed int/double values for what should be a double
                  parameter can throw a type-mismatch error at load time.
                </li>
                <li>
                  In <span className="font-mono">joint_limits.yaml</span>, Setup Assistant sometimes leaves{' '}
                  <span className="font-mono">has_acceleration_limits: false</span> for joints with no acceleration spec in the
                  URDF. Time-parameterization (TOTG) needs an acceleration bound to produce a smooth trajectory &mdash; turn it
                  on and give each joint a real value (0.2&ndash;0.3 rad/s&sup2; is a reasonable starting point if you don&apos;t
                  have a datasheet number, then tune from there).
                </li>
              </ul>
            </div>

            {totalErrors === 0 && readinessBlockers.length === 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
                No blocking errors found across the files you&apos;ve loaded.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
