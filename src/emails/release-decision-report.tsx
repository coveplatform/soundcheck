import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import { ReleaseDecisionReport } from "@/lib/release-decision-report";

interface ReleaseDecisionReportEmailProps {
  artistName: string;
  trackTitle: string;
  report: ReleaseDecisionReport;
  trackUrl: string;
}

export function ReleaseDecisionReportEmail({
  artistName,
  trackTitle,
  report,
  trackUrl,
}: ReleaseDecisionReportEmailProps) {
  const { verdict, readinessScore, topFixes, aiAnalysis } = report;

  const verdictColor =
    verdict.consensus === "RELEASE_NOW"
      ? "#10b981"
      : verdict.consensus === "FIX_FIRST"
        ? "#f59e0b"
        : "#ef4444";

  const verdictText =
    verdict.consensus === "RELEASE_NOW"
      ? "✅ RELEASE NOW"
      : verdict.consensus === "FIX_FIRST"
        ? "⚠️ FIX FIRST"
        : "🔧 NEEDS WORK";

  return (
    <Html>
      <Head />
      <Preview>
        Your Release Decision for "{trackTitle}" is ready - {verdictText}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Release Decision Report</Heading>
            <Text style={subtitle}>For: {trackTitle}</Text>
          </Section>

          {/* Verdict Section */}
          <Section style={verdictSection}>
            <div style={{ ...verdictBadge, backgroundColor: verdictColor }}>
              <Text style={verdictLabel}>{verdictText}</Text>
            </div>
            <Text style={verdictDetails}>
              {verdict.breakdown.RELEASE_NOW} reviewers said RELEASE NOW •{" "}
              {verdict.breakdown.FIX_FIRST} said FIX FIRST •{" "}
              {verdict.breakdown.NEEDS_WORK} said NEEDS WORK
            </Text>
            <Text style={confidenceText}>
              Confidence: <strong>{verdict.confidence}</strong> ({report.reviewCount} expert reviewers)
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Readiness Score */}
          <Section style={section}>
            <Heading style={h2}>📊 Release Readiness</Heading>
            <div style={scoreBox}>
              <Text style={scoreNumber}>{readinessScore.average}/100</Text>
              <Text style={scoreLabel}>Average Score</Text>
            </div>
            <Text style={scoreDetails}>
              Range: {readinessScore.range[0]}-{readinessScore.range[1]} • Median:{" "}
              {readinessScore.median}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Top Fixes */}
          {topFixes.length > 0 && (
            <>
              <Section style={section}>
                <Heading style={h2}>🔧 Top Fixes (Prioritized)</Heading>
                {topFixes.map((fix, i) => (
                  <div key={i} style={fixItem}>
                    <div style={fixNumber}>{i + 1}</div>
                    <div style={fixContent}>
                      <Text style={fixIssue}>{fix.issue}</Text>
                      <Text style={fixMeta}>
                        Mentioned by {fix.mentionedBy}/{report.reviewCount} reviewers •{" "}
                        <span
                          style={{
                            color:
                              fix.avgImpact === "HIGH"
                                ? "#ef4444"
                                : fix.avgImpact === "MEDIUM"
                                  ? "#f59e0b"
                                  : "#10b981",
                            fontWeight: 600,
                          }}
                        >
                          {fix.avgImpact} IMPACT
                        </span>{" "}
                        • ~{fix.avgTimeEstimate} minutes
                      </Text>
                    </div>
                  </div>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* AI Analysis */}
          <Section style={aiSection}>
            <Heading style={h2}>🤖 AI-Powered Analysis</Heading>

            <div style={aiBox}>
              <Text style={aiHeading}>Summary</Text>
              <Text style={aiText}>{aiAnalysis.summary}</Text>
            </div>

            {aiAnalysis.technicalInsights && (
              <div style={aiBox}>
                <Text style={aiHeading}>Technical Insights</Text>
                <Text style={aiText}>{aiAnalysis.technicalInsights}</Text>
              </div>
            )}

            {aiAnalysis.marketRecommendation && (
              <div style={aiBox}>
                <Text style={aiHeading}>Market Recommendation</Text>
                <Text style={aiText}>{aiAnalysis.marketRecommendation}</Text>
              </div>
            )}

            <div style={aiBox}>
              <Text style={aiHeading}>Estimated Work Required</Text>
              <Text style={aiText}>{aiAnalysis.estimatedWorkRequired}</Text>
            </div>

            {aiAnalysis.prioritizedActionPlan.length > 0 && (
              <div style={aiBox}>
                <Text style={aiHeading}>Action Plan</Text>
                {aiAnalysis.prioritizedActionPlan.map((action, i) => (
                  <Text key={i} style={actionItem}>
                    {i + 1}. {action}
                  </Text>
                ))}
              </div>
            )}
          </Section>

          <Hr style={divider} />

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <>
              <Section style={section}>
                <Heading style={h2}>✨ What's Working</Heading>
                {report.strengths.slice(0, 3).map((strength, i) => (
                  <Text key={i} style={listItem}>
                    • {strength}
                  </Text>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Risks */}
          {report.risks.length > 0 && (
            <>
              <Section style={section}>
                <Heading style={h2}>⚠️ Potential Risks</Heading>
                {report.risks.slice(0, 3).map((risk, i) => (
                  <Text key={i} style={listItem}>
                    • {risk}
                  </Text>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={trackUrl} style={button}>
              View Full Report & Reviews
            </Link>
            <Text style={footerText}>
              This report was generated from {report.reviewCount} expert reviewers with 100+ reviews
              each and 4.5+ ratings.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              MixReflect • Release Decision Report
              <br />
              Generated on {new Date(report.generatedAt).toLocaleDateString()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 32px 24px",
  backgroundColor: "#7c3aed",
  borderRadius: "12px 12px 0 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "800",
  lineHeight: "1.2",
  margin: "0 0 8px",
};

const subtitle = {
  color: "#e9d5ff",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
};

const h2 = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const section = {
  padding: "24px 32px",
};

const verdictSection = {
  padding: "32px",
  textAlign: "center" as const,
  backgroundColor: "#faf8f5",
};

const verdictBadge = {
  display: "inline-block",
  padding: "16px 32px",
  borderRadius: "12px",
  marginBottom: "16px",
};

const verdictLabel = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "900",
  margin: "0",
  letterSpacing: "0.5px",
};

const verdictDetails = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "8px 0",
};

const confidenceText = {
  color: "#374151",
  fontSize: "14px",
  margin: "4px 0 0",
};

const scoreBox = {
  backgroundColor: "#f3f4f6",
  padding: "24px",
  borderRadius: "12px",
  textAlign: "center" as const,
  marginBottom: "12px",
};

const scoreNumber = {
  fontSize: "48px",
  fontWeight: "900",
  color: "#7c3aed",
  margin: "0",
  lineHeight: "1",
};

const scoreLabel = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "8px 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  fontWeight: "600",
};

const scoreDetails = {
  fontSize: "14px",
  color: "#6b7280",
  textAlign: "center" as const,
};

const fixItem = {
  display: "flex",
  gap: "16px",
  marginBottom: "20px",
  alignItems: "flex-start",
};

const fixNumber = {
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "16px",
  flexShrink: 0,
};

const fixContent = {
  flex: 1,
};

const fixIssue = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 6px",
};

const fixMeta = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0",
};

const aiSection = {
  padding: "24px 32px",
  backgroundColor: "#faf5ff",
};

const aiBox = {
  marginBottom: "20px",
};

const aiHeading = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#7c3aed",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const aiText = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0",
};

const actionItem = {
  fontSize: "15px",
  color: "#374151",
  margin: "6px 0",
  paddingLeft: "8px",
};

const listItem = {
  fontSize: "15px",
  color: "#374151",
  margin: "10px 0",
  lineHeight: "1.5",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const ctaSection = {
  padding: "32px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#7c3aed",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  marginBottom: "16px",
};

const footer = {
  padding: "24px 32px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "8px 0",
};

export default ReleaseDecisionReportEmail;
