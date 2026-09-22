import type { CompatibilityReport, Finding, QosProfile, Verdict } from './types';

/**
 * Ports `rmw_dds_common::qos_profile_check_compatible` (rmw_dds_common/src/qos.cpp on the
 * humble branch) policy-for-policy, so the verdicts here match what ROS 2 itself would
 * report for the same two profiles. History/depth and lifespan are intentionally excluded
 * from this logic because the real implementation never considers them for wire
 * compatibility either — they only affect local buffering/expiry behavior.
 */

function ok(policy: string, message: string): Finding {
  return { policy, verdict: 'ok', message };
}

function reliabilityFinding(pub: QosProfile, sub: QosProfile): Finding {
  if (pub.reliability === 'best_effort' && sub.reliability === 'reliable') {
    return {
      policy: 'Reliability',
      verdict: 'error',
      message: 'Best-effort publisher and reliable subscription: the subscriber requires reliable delivery, but the publisher only offers best-effort.',
    };
  }
  return ok('Reliability', 'Compatible.');
}

function durabilityFinding(pub: QosProfile, sub: QosProfile): Finding {
  if (pub.durability === 'volatile' && sub.durability === 'transient_local') {
    return {
      policy: 'Durability',
      verdict: 'error',
      message: "Volatile publisher and transient-local subscription: the subscriber wants to receive messages published before it joined, but the publisher doesn't keep any history for late joiners.",
    };
  }
  return ok('Durability', 'Compatible.');
}

function deadlineFinding(pub: QosProfile, sub: QosProfile): Finding {
  const { deadlineMs: pubDeadline } = pub;
  const { deadlineMs: subDeadline } = sub;
  if (pubDeadline === null && subDeadline !== null) {
    return { policy: 'Deadline', verdict: 'error', message: "The subscription requires a deadline, but the publisher doesn't offer one." };
  }
  if (pubDeadline !== null && subDeadline !== null && subDeadline < pubDeadline) {
    return {
      policy: 'Deadline',
      verdict: 'error',
      message: `The subscription's deadline (${subDeadline} ms) is shorter than the publisher's (${pubDeadline} ms) — the publisher can't guarantee messages that often.`,
    };
  }
  return ok('Deadline', 'Compatible.');
}

function livelinessKindFinding(pub: QosProfile, sub: QosProfile): Finding {
  if (pub.livelinessKind === 'automatic' && sub.livelinessKind === 'manual_by_topic') {
    return {
      policy: 'Liveliness',
      verdict: 'error',
      message: "The publisher's liveliness is automatic, but the subscription requires manual-by-topic assertions.",
    };
  }
  return ok('Liveliness', 'Compatible.');
}

function livelinessLeaseFinding(pub: QosProfile, sub: QosProfile): Finding {
  const { livelinessLeaseMs: pubLease } = pub;
  const { livelinessLeaseMs: subLease } = sub;
  if (pubLease === null && subLease !== null) {
    return { policy: 'Liveliness lease duration', verdict: 'error', message: "The subscription requires a liveliness lease duration, but the publisher doesn't offer one." };
  }
  if (pubLease !== null && subLease !== null && subLease < pubLease) {
    return {
      policy: 'Liveliness lease duration',
      verdict: 'error',
      message: `The subscription's liveliness lease duration (${subLease} ms) is shorter than the publisher's (${pubLease} ms).`,
    };
  }
  return ok('Liveliness lease duration', 'Compatible.');
}

/** Only reliability, durability and liveliness-kind get a "can't tell, one side is
 * system-default" warning in the real implementation — deadline and lease duration don't. */
function applyUnknownWarning(finding: Finding, pubValue: string, subValue: string, strictValue: string, looseValue: string): Finding {
  const pubUnknown = pubValue === 'system_default';
  const subUnknown = subValue === 'system_default';

  if (pubUnknown && subUnknown) {
    return { ...finding, verdict: 'warning', message: `Both sides use "system default" for ${finding.policy.toLowerCase()} — the actual behavior depends on your RMW implementation's default, so compatibility can't be confirmed here.` };
  }
  if (pubUnknown && subValue === strictValue) {
    return {
      ...finding,
      verdict: 'warning',
      message: `The subscription requires "${strictValue}", but the publisher's ${finding.policy.toLowerCase()} is "system default" — can't confirm compatibility without knowing your RMW's default.`,
    };
  }
  if (pubValue === looseValue && subUnknown) {
    return {
      ...finding,
      verdict: 'warning',
      message: `The publisher offers "${looseValue}", but the subscription's ${finding.policy.toLowerCase()} is "system default" — can't confirm compatibility without knowing your RMW's default.`,
    };
  }
  return finding;
}

export function checkCompatibility(publisher: QosProfile, subscription: QosProfile): CompatibilityReport {
  let reliability = reliabilityFinding(publisher, subscription);
  let durability = durabilityFinding(publisher, subscription);
  const deadline = deadlineFinding(publisher, subscription);
  let liveliness = livelinessKindFinding(publisher, subscription);
  const livelinessLease = livelinessLeaseFinding(publisher, subscription);

  const findings: Finding[] = [reliability, durability, deadline, liveliness, livelinessLease];
  const hasError = findings.some((f) => f.verdict === 'error');

  // The real implementation only evaluates "system default" warnings once it knows there
  // are no hard errors elsewhere in the profile pair.
  if (!hasError) {
    reliability = applyUnknownWarning(reliability, publisher.reliability, subscription.reliability, 'reliable', 'best_effort');
    durability = applyUnknownWarning(durability, publisher.durability, subscription.durability, 'transient_local', 'volatile');
    liveliness = applyUnknownWarning(liveliness, publisher.livelinessKind, subscription.livelinessKind, 'manual_by_topic', 'automatic');
  }

  const finalFindings = [reliability, durability, deadline, liveliness, livelinessLease];
  const overall: Verdict = hasError ? 'error' : finalFindings.some((f) => f.verdict === 'warning') ? 'warning' : 'ok';

  return { overall, findings: finalFindings };
}
