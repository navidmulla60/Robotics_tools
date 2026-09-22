'use client';

import { useState } from 'react';
import NumberField from '@/components/common/NumberField';
import SliderField from '@/components/common/SliderField';
import type { AmclParams } from '@/lib/nav2/types';

interface Props {
  params: AmclParams;
  onChange: (params: AmclParams) => void;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 font-mono text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0 dark:border-neutral-800">
      <button type="button" onClick={() => setOpen((o) => !o)} className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        {open ? '−' : '+'} {title}
      </button>
      {open && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>}
    </div>
  );
}

export default function AmclParamsPanel({ params, onChange }: Props) {
  const set = <K extends keyof AmclParams>(key: K, value: AmclParams[K]) => onChange({ ...params, [key]: value });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">AMCL parameters</h2>
      <div className="space-y-3">
        <Section title="Particle filter" defaultOpen>
          <NumberField label="min_particles" value={params.min_particles} onChange={(v) => set('min_particles', Math.round(v))} decimals={0} />
          <NumberField label="max_particles" value={params.max_particles} onChange={(v) => set('max_particles', Math.round(v))} decimals={0} />
          <SliderField label="pf_err" value={params.pf_err} onChange={(v) => set('pf_err', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="pf_z" value={params.pf_z} onChange={(v) => set('pf_z', v)} min={0} max={1} step={0.01} decimals={3} />
          <NumberField label="resample_interval" value={params.resample_interval} onChange={(v) => set('resample_interval', Math.round(v))} decimals={0} />
          <SliderField label="recovery_alpha_slow" value={params.recovery_alpha_slow} onChange={(v) => set('recovery_alpha_slow', v)} min={0} max={0.5} step={0.001} decimals={4} />
          <SliderField label="recovery_alpha_fast" value={params.recovery_alpha_fast} onChange={(v) => set('recovery_alpha_fast', v)} min={0} max={0.5} step={0.001} decimals={4} />
        </Section>

        <Section title="Odometry motion model" defaultOpen>
          <SelectField
            label="robot_model_type"
            value={params.robot_model_type}
            options={['nav2_amcl::DifferentialMotionModel', 'nav2_amcl::OmniMotionModel']}
            onChange={(v) => set('robot_model_type', v)}
          />
          <SliderField label="alpha1" value={params.alpha1} onChange={(v) => set('alpha1', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="alpha2" value={params.alpha2} onChange={(v) => set('alpha2', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="alpha3" value={params.alpha3} onChange={(v) => set('alpha3', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="alpha4" value={params.alpha4} onChange={(v) => set('alpha4', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="alpha5" value={params.alpha5} onChange={(v) => set('alpha5', v)} min={0} max={1} step={0.01} decimals={3} />
        </Section>

        <Section title="Laser / sensor model">
          <SelectField
            label="laser_model_type"
            value={params.laser_model_type}
            options={['likelihood_field', 'beam', 'likelihood_field_prob']}
            onChange={(v) => set('laser_model_type', v)}
          />
          <SliderField label="laser_max_range" value={params.laser_max_range} onChange={(v) => set('laser_max_range', v)} min={0} max={100} step={0.5} decimals={2} />
          <NumberField label="laser_min_range (-1 = auto)" value={params.laser_min_range} onChange={(v) => set('laser_min_range', v)} decimals={2} />
          <SliderField label="laser_likelihood_max_dist" value={params.laser_likelihood_max_dist} onChange={(v) => set('laser_likelihood_max_dist', v)} min={0} max={5} step={0.05} decimals={2} />
          <NumberField label="max_beams" value={params.max_beams} onChange={(v) => set('max_beams', Math.round(v))} decimals={0} />
          <SliderField label="z_hit" value={params.z_hit} onChange={(v) => set('z_hit', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="z_max" value={params.z_max} onChange={(v) => set('z_max', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="z_rand" value={params.z_rand} onChange={(v) => set('z_rand', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="z_short" value={params.z_short} onChange={(v) => set('z_short', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="sigma_hit" value={params.sigma_hit} onChange={(v) => set('sigma_hit', v)} min={0} max={1} step={0.01} decimals={3} />
          <SliderField label="lambda_short" value={params.lambda_short} onChange={(v) => set('lambda_short', v)} min={0} max={5} step={0.05} decimals={3} />
          <CheckField label="do_beamskip" checked={params.do_beamskip} onChange={(v) => set('do_beamskip', v)} />
          <SliderField label="beam_skip_distance" value={params.beam_skip_distance} onChange={(v) => set('beam_skip_distance', v)} min={0} max={2} step={0.01} decimals={2} />
          <SliderField label="beam_skip_threshold" value={params.beam_skip_threshold} onChange={(v) => set('beam_skip_threshold', v)} min={0} max={1} step={0.01} decimals={2} />
          <SliderField label="beam_skip_error_threshold" value={params.beam_skip_error_threshold} onChange={(v) => set('beam_skip_error_threshold', v)} min={0} max={1} step={0.01} decimals={2} />
        </Section>

        <Section title="Update thresholds & timing" defaultOpen>
          <SliderField label="update_min_d (m)" value={params.update_min_d} onChange={(v) => set('update_min_d', v)} min={0} max={2} step={0.01} decimals={3} />
          <SliderField label="update_min_a (rad)" value={params.update_min_a} onChange={(v) => set('update_min_a', v)} min={0} max={Math.PI} step={0.01} decimals={3} />
          <SliderField label="transform_tolerance (s)" value={params.transform_tolerance} onChange={(v) => set('transform_tolerance', v)} min={0} max={5} step={0.05} decimals={2} />
          <SliderField label="save_pose_rate (Hz)" value={params.save_pose_rate} onChange={(v) => set('save_pose_rate', v)} min={0} max={10} step={0.1} decimals={2} />
          <CheckField label="tf_broadcast" checked={params.tf_broadcast} onChange={(v) => set('tf_broadcast', v)} />
        </Section>

        <Section title="Frames & topics">
          <TextField label="base_frame_id" value={params.base_frame_id} onChange={(v) => set('base_frame_id', v)} />
          <TextField label="odom_frame_id" value={params.odom_frame_id} onChange={(v) => set('odom_frame_id', v)} />
          <TextField label="global_frame_id" value={params.global_frame_id} onChange={(v) => set('global_frame_id', v)} />
          <TextField label="scan_topic" value={params.scan_topic} onChange={(v) => set('scan_topic', v)} />
          <TextField label="map_topic" value={params.map_topic} onChange={(v) => set('map_topic', v)} />
        </Section>

        <Section title="Initial pose & misc">
          <CheckField label="set_initial_pose" checked={params.set_initial_pose} onChange={(v) => set('set_initial_pose', v)} />
          {params.set_initial_pose && (
            <>
              <NumberField label="initial_pose.x" value={params.initial_pose_x} onChange={(v) => set('initial_pose_x', v)} decimals={3} />
              <NumberField label="initial_pose.y" value={params.initial_pose_y} onChange={(v) => set('initial_pose_y', v)} decimals={3} />
              <NumberField label="initial_pose.z" value={params.initial_pose_z} onChange={(v) => set('initial_pose_z', v)} decimals={3} />
              <SliderField label="initial_pose.yaw" value={params.initial_pose_yaw} onChange={(v) => set('initial_pose_yaw', v)} min={-Math.PI} max={Math.PI} step={0.01} decimals={3} />
            </>
          )}
          <CheckField label="first_map_only" checked={params.first_map_only} onChange={(v) => set('first_map_only', v)} />
          <CheckField label="always_reset_initial_pose" checked={params.always_reset_initial_pose} onChange={(v) => set('always_reset_initial_pose', v)} />
        </Section>
      </div>
    </div>
  );
}
