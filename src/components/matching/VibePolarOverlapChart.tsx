import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { UserProfile, MatchProfile, Language } from '../../types';
import { useQuestionCatalog } from '../../hooks/useQuestionCatalog';
import { resolveCatalogOptionLabel } from '../../services/questionCatalogService';
import {
  normalizeOptionKey,
  isNoneOption,
  isNotApplicableOption,
} from '../../services/matchingService';
import { useTouchGlow } from '../../hooks/useTouchGlow';
import { playClickPop } from '../../utils/soundEffects';
import { Sparkles, Zap, Info } from 'lucide-react';

interface VibePolarOverlapChartProps {
  userProfile: UserProfile;
  match: MatchProfile;
  language: Language;
}

interface PolarDimension {
  id: string;
  questionIds: string[];
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  icon: string;
  userScore: number;
  matchScore: number;
  overlapScore: number;
  diffPercent: number;
  isExactDomain: boolean;
  userAnswerLabel: string;
  matchAnswerLabel: string;
}

function toCleanOptionList(val: string | string[] | undefined): string[] {
  if (!val) return [];
  const raw = Array.isArray(val) ? val : [val];
  return raw
    .map((x) => normalizeOptionKey(String(x).trim()))
    .filter((x) => x.length > 0 && !isNotApplicableOption(x));
}

export const VibePolarOverlapChart: React.FC<VibePolarOverlapChartProps> = ({
  userProfile,
  match,
  language,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'both' | 'user' | 'match'>('both');
  const { glowPos, glowHandlers } = useTouchGlow({ haptic: true });
  const isAr = language === 'ar';

  const { allDisplayQuestions } = useQuestionCatalog();

  // Compute 6 comprehensive personality dimensions from all real answers so genuine differences & percentages shine clearly
  const dimensions: PolarDimension[] = useMemo(() => {
    const domainDefs = [
      {
        id: 'q_coffee',
        questionIds: ['q_coffee', 'q_drinks'],
        labelAr: 'عالم القهوة ☕',
        labelEn: 'Coffee & Drinks ☕',
        shortAr: 'القهوة والمشروبات',
        shortEn: 'Coffee & Drinks',
        icon: 'coffee',
      },
      {
        id: 'q_sports',
        questionIds: ['q_sports', 'q_sports_watch'],
        labelAr: 'الرياضة والحركة 🎾',
        labelEn: 'Active Sports 🎾',
        shortAr: 'الرياضة والحركة',
        shortEn: 'Active Sports',
        icon: 'dumbbell',
      },
      {
        id: 'q_leisure',
        questionIds: ['q_leisure', 'q_places', 'q_events'],
        labelAr: 'سهرة الويكند 🌙',
        labelEn: 'Weekend Vibe 🌙',
        shortAr: 'سهرة الويكند',
        shortEn: 'Weekend Vibe',
        icon: 'moon',
      },
      {
        id: 'q_food',
        questionIds: ['q_food', 'q_travel'],
        labelAr: 'المطاعم والذوق 🍔',
        labelEn: 'Food & Dining 🍔',
        shortAr: 'المطاعم والسفر',
        shortEn: 'Food & Travel',
        icon: 'utensils',
      },
      {
        id: 'q_cars',
        questionIds: ['q_cars', 'q_tech', 'q_apps'],
        labelAr: 'السيارات والتقنية 🚗',
        labelEn: 'Cars & Tech 🚗',
        shortAr: 'السيارات والتطبيقات',
        shortEn: 'Cars, Tech & Apps',
        icon: 'car',
      },
      {
        id: 'q_vibe',
        questionIds: ['q_vibe', 'q_lifestyle', 'q_hobbies', 'q_entertainment'],
        labelAr: 'شحن الطاقة ⚡',
        labelEn: 'Social Energy ⚡',
        shortAr: 'الطاقة والهوايات',
        shortEn: 'Energy & Hobbies',
        icon: 'zap',
      },
    ];

    const formatQuestionAnswer = (qid: string, ans: string | string[] | undefined): string | null => {
      if (!ans) return null;
      const list = Array.isArray(ans) ? ans : [ans];
      const cleaned = list.filter((x) => !isNotApplicableOption(String(x)));
      if (cleaned.length === 0) return null;
      const labels = cleaned
        .map((optId) => resolveCatalogOptionLabel(qid, String(optId), language))
        .filter(Boolean);
      return labels.length > 0 ? labels.join(' • ') : null;
    };

    // Deterministic trait expression score [52..97] derived from actual selected catalog options
    const computeTraitExpression = (
      answersMap: Record<string, string | string[]>,
      qids: string[],
      axisIndex: number
    ): number => {
      let total = 0;
      let count = 0;

      qids.forEach((qid, qIdx) => {
        const list = toCleanOptionList(answersMap[qid]);
        if (list.length === 0) return;

        if (list.some(isNoneOption)) {
          total += 46;
          count += 1;
          return;
        }

        const qObj = allDisplayQuestions.find((item) => item.id === qid);
        const validOpts = qObj?.options.filter((o) => !isNoneOption(o.id) && !isNotApplicableOption(o.id)) || [];
        const optCount = Math.max(1, validOpts.length);

        // Compute deterministic option signature based on catalog option positions + multi-select richness
        let optPosSum = 0;
        list.forEach((selectedId) => {
          const idx = validOpts.findIndex((o) => normalizeOptionKey(o.id) === selectedId);
          const resolvedIdx = idx >= 0 ? idx : (selectedId.charCodeAt(selectedId.length - 1) % optCount);
          // Spread single choices evenly across [60..92]
          const ratio = optCount > 1 ? resolvedIdx / (optCount - 1) : 0.6;
          optPosSum += 60 + Math.round((1 - ratio * 0.55) * 32);
        });

        const avgOptScore = optPosSum / list.length;
        const multiBonus = list.length >= 3 ? 7 : list.length === 2 ? 4 : 0;
        const subScore = Math.min(97, Math.max(52, Math.round(avgOptScore + multiBonus - qIdx * 2 + (axisIndex % 2) * 2)));

        total += subScore;
        count += 1;
      });

      return count > 0 ? Math.round(total / count) : 65;
    };

    return domainDefs.map((d, axisIdx) => {
      let diceSum = 0;
      let comparedCount = 0;
      let allIdentical = true;
      let userSignatureHash = 0;
      let matchSignatureHash = 0;

      const userSummaryParts: string[] = [];
      const matchSummaryParts: string[] = [];

      d.questionIds.forEach((qid) => {
        const uLabel = formatQuestionAnswer(qid, userProfile.answers[qid]);
        const mLabel = formatQuestionAnswer(qid, match.answers[qid]);
        if (uLabel && userSummaryParts.length < 2) userSummaryParts.push(uLabel);
        if (mLabel && matchSummaryParts.length < 2) matchSummaryParts.push(mLabel);

        const listA = toCleanOptionList(userProfile.answers[qid]);
        const listB = toCleanOptionList(match.answers[qid]);

        if (listA.length === 0 || listB.length === 0) return;

        comparedCount += 1;
        const setA = new Set(listA);
        const setB = new Set(listB);

        let inter = 0;
        setA.forEach((item) => {
          if (setB.has(item)) inter += 1;
        });

        const dice = (2 * inter) / (setA.size + setB.size);
        diceSum += dice;

        if (dice < 0.999) {
          allIdentical = false;
        }

        userSignatureHash += listA.join(',').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        matchSignatureHash += listB.join(',').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      });

      const avgDice = comparedCount > 0 ? diceSum / comparedCount : 0.5;
      const isExactDomain = comparedCount > 0 && allIdentical;

      // Authentic overlap percentage for this axis (100% only when ALL compared choices in domain match)
      const overlapScore = isExactDomain
        ? 100
        : Math.min(94, Math.max(32, Math.round(28 + avgDice * 68)));

      let userScore = computeTraitExpression(userProfile.answers, d.questionIds, axisIdx);
      let matchScore = computeTraitExpression(match.answers, d.questionIds, axisIdx);

      if (isExactDomain) {
        // Identical choices in this domain -> both polygons meet cleanly at the same high score
        const unified = Math.max(92, Math.max(userScore, matchScore));
        userScore = unified;
        matchScore = unified;
      } else {
        // Ensure visible, proportional separation whenever their actual choices differ
        const minVisualGap = Math.max(14, Math.round((1 - avgDice) * 30));
        const currentGap = Math.abs(userScore - matchScore);

        if (currentGap < minVisualGap) {
          const halfAdd = Math.ceil((minVisualGap - currentGap) / 2);
          const userHigher =
            userScore > matchScore ||
            (userScore === matchScore && (userSignatureHash + axisIdx) % 2 === 0);

          if (userHigher) {
            userScore = Math.min(97, userScore + halfAdd);
            matchScore = Math.max(46, userScore - minVisualGap);
          } else {
            matchScore = Math.min(97, matchScore + halfAdd);
            userScore = Math.max(46, matchScore - minVisualGap);
          }
        }
      }

      const diffPercent = Math.abs(userScore - matchScore);

      return {
        id: d.id,
        questionIds: d.questionIds,
        labelAr: d.labelAr,
        labelEn: d.labelEn,
        shortAr: d.shortAr,
        shortEn: d.shortEn,
        icon: d.icon,
        userScore,
        matchScore,
        overlapScore,
        diffPercent,
        isExactDomain,
        userAnswerLabel:
          userSummaryParts.join(' ، ') || (isAr ? 'غير محدد' : 'Not set'),
        matchAnswerLabel:
          matchSummaryParts.join(' ، ') || (isAr ? 'غير محدد' : 'Not set'),
      };
    });
  }, [allDisplayQuestions, userProfile.answers, match.answers, language, isAr]);

  const activeDimension = useMemo(() => {
    if (!selectedDimId) return dimensions[1] || dimensions[0] || null;
    return dimensions.find((d) => d.id === selectedDimId) || dimensions[0] || null;
  }, [dimensions, selectedDimId]);

  // Overall overlap & profile averages
  const averageOverlap = useMemo(() => {
    const sum = dimensions.reduce((acc, curr) => acc + curr.overlapScore, 0);
    return Math.round(sum / dimensions.length);
  }, [dimensions]);

  const averageUserScore = useMemo(() => {
    const sum = dimensions.reduce((acc, curr) => acc + curr.userScore, 0);
    return Math.round(sum / dimensions.length);
  }, [dimensions]);

  const averageMatchScore = useMemo(() => {
    const sum = dimensions.reduce((acc, curr) => acc + curr.matchScore, 0);
    return Math.round(sum / dimensions.length);
  }, [dimensions]);

  // Render animated D3 polar chart with unmistakable differences & super-clear percentages at EVERY spot
  useEffect(() => {
    if (!svgRef.current) return;

    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    const width = 468;
    const height = 424;
    const cx = width / 2;
    const cy = height / 2 + 2;
    const radius = 110;
    const numPoints = dimensions.length;
    const angleStep = (Math.PI * 2) / numPoints;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('dir', 'ltr')
      .append('g')
      .attr('transform', `translate(${cx}, ${cy})`);

    // Radius scale: starts at 18px outside center medallion so inner values remain distinct
    const rScale = d3.scaleLinear().domain([0, 100]).range([18, radius]);

    // 1. Concentric grid circles (25%, 50%, 75%, 100%) + Clear Diagonal Scale Percentages
    const levels = [25, 50, 75, 100];
    const scaleLabelAngle = -Math.PI / 3; // -60 deg: cleanly between top (-90) and top-right (-30) spokes
    levels.forEach((level) => {
      const r = rScale(level);
      g.append('circle')
        .attr('r', r)
        .attr('fill', level === 100 ? (isDark ? 'rgba(16,185,129,0.03)' : 'rgba(11,93,59,0.025)') : 'none')
        .attr('stroke', isDark ? '#334155' : '#CBD5E1')
        .attr('stroke-width', level === 100 ? 1.5 : 1)
        .attr('stroke-opacity', level === 100 ? 0.7 : 0.45)
        .attr('stroke-dasharray', level === 100 ? 'none' : '3,3');

      const lx = Math.cos(scaleLabelAngle) * r;
      const ly = Math.sin(scaleLabelAngle) * r;

      g.append('rect')
        .attr('x', lx - 14)
        .attr('y', ly - 7)
        .attr('width', 28)
        .attr('height', 14)
        .attr('rx', 6)
        .attr('fill', isDark ? '#141D17' : '#F8F7F2')
        .attr('fill-opacity', 0.92);

      g.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('direction', 'ltr')
        .attr('fill', isDark ? '#94A3B8' : '#64748B')
        .attr('font-size', '9.5px')
        .attr('font-weight', '800')
        .style('font-variant-numeric', 'tabular-nums')
        .text(`${level}%`);
    });

    // 2. Radial spokes + Difference Gap Highlights + Outer Axis Station Badges (Title + Big Clear %)
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const xOuter = Math.cos(angle) * radius;
      const yOuter = Math.sin(angle) * radius;
      const isSelected = activeDimension?.id === dim.id;

      // Base spoke line
      g.append('line')
        .attr('x1', Math.cos(angle) * 24)
        .attr('y1', Math.sin(angle) * 24)
        .attr('x2', xOuter)
        .attr('y2', yOuter)
        .attr('stroke', isSelected ? '#10B981' : isDark ? '#334155' : '#CBD5E1')
        .attr('stroke-width', isSelected ? 2 : 1.2)
        .attr('stroke-opacity', isSelected ? 0.85 : 0.55);

      // Visual Difference Bridge along the spoke when in 'both' mode & scores differ
      if (filterMode === 'both' && dim.diffPercent > 0) {
        const rMin = rScale(Math.min(dim.userScore, dim.matchScore));
        const rMax = rScale(Math.max(dim.userScore, dim.matchScore));
        g.append('line')
          .attr('x1', Math.cos(angle) * rMin)
          .attr('y1', Math.sin(angle) * rMin)
          .attr('x2', Math.cos(angle) * rMax)
          .attr('y2', Math.sin(angle) * rMax)
          .attr('stroke', '#F59E0B')
          .attr('stroke-width', 4)
          .attr('stroke-linecap', 'round')
          .attr('stroke-opacity', 0.75);
      }

      // Compute clean, collision-free outer station anchor for each of the 6 vertices
      const isTop = i === 0;
      const isBottom = i === 3;
      const isRightSide = i === 1 || i === 2;
      const stationDist = isTop || isBottom ? radius + 50 : radius + 64;
      const sx = Math.cos(angle) * stationDist + (isRightSide ? 5 : i === 4 || i === 5 ? -5 : 0);
      const sy =
        Math.sin(angle) * stationDist +
        (isTop ? -6 : isBottom ? 8 : i === 1 || i === 5 ? -10 : 10);

      const stationGroup = g
        .append('g')
        .attr('transform', `translate(${sx}, ${sy})`)
        .attr('class', 'cursor-pointer')
        .on('click', () => {
          playClickPop();
          setSelectedDimId(dim.id);
        });

      // Determine displayed station percentage & semantic badge colors
      const shownStationPercent =
        filterMode === 'user'
          ? dim.userScore
          : filterMode === 'match'
          ? dim.matchScore
          : dim.overlapScore;

      let pillFill = '#0B5D3B';
      let pillStroke = '#34D399';
      let pillText = '#FFFFFF';

      if (filterMode === 'user') {
        pillFill = '#0B5D3B';
        pillStroke = '#34D399';
        pillText = '#FFFFFF';
      } else if (filterMode === 'match') {
        pillFill = '#B45309';
        pillStroke = '#FBBF24';
        pillText = '#FFFFFF';
      } else if (shownStationPercent >= 85) {
        pillFill = '#0B5D3B';
        pillStroke = '#34D399';
        pillText = '#FFFFFF';
      } else if (shownStationPercent >= 60) {
        pillFill = isDark ? '#422006' : '#FEF3C7';
        pillStroke = '#F59E0B';
        pillText = isDark ? '#FDE68A' : '#92400E';
      } else {
        pillFill = isDark ? '#431407' : '#FFEDD5';
        pillStroke = '#F97316';
        pillText = isDark ? '#FDBA74' : '#C2410C';
      }

      const titleY = isBottom ? 14 : -12;
      const pillY = isBottom ? -11 : 12;

      // Axis Category Name
      stationGroup
        .append('text')
        .attr('x', 0)
        .attr('y', titleY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '12px')
        .attr('font-weight', '900')
        .attr('fill', isSelected ? (isDark ? '#34D399' : '#0B5D3B') : isDark ? '#F1F5F9' : '#142019')
        .text(isAr ? dim.labelAr : dim.labelEn);

      // Prominent Axis Percentage Pill
      const badgeText =
        filterMode === 'both'
          ? isAr
            ? `توافق ${shownStationPercent}%`
            : `${shownStationPercent}% Match`
          : `${shownStationPercent}%`;
      const pillW = filterMode === 'both' ? 78 : 52;
      const pillH = 21;

      stationGroup
        .append('rect')
        .attr('x', -pillW / 2)
        .attr('y', pillY - pillH / 2)
        .attr('width', pillW)
        .attr('height', pillH)
        .attr('rx', 10.5)
        .attr('fill', pillFill)
        .attr('stroke', isSelected ? '#10B981' : pillStroke)
        .attr('stroke-width', isSelected ? 2 : 1.4);

      stationGroup
        .append('text')
        .attr('x', 0)
        .attr('y', pillY + 0.5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '11.5px')
        .attr('font-weight', '900')
        .attr('fill', pillText)
        .style('font-variant-numeric', 'tabular-nums')
        .text(badgeText);
    });

    // Radial Polygon Generator
    const lineGenerator = d3
      .lineRadial<number>()
      .radius((d) => rScale(d))
      .angle((_, i) => i * angleStep)
      .curve(d3.curveLinearClosed);

    // 3. User Polygon (Emerald Green)
    if (filterMode === 'both' || filterMode === 'user') {
      const userData = dimensions.map((d) => d.userScore);
      const userPath = g
        .append('path')
        .datum(userData)
        .attr('d', lineGenerator)
        .attr('fill', 'rgba(16, 185, 129, 0.24)')
        .attr('stroke', '#059669')
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .style('opacity', 0);

      userPath.transition().duration(700).ease(d3.easeCubicOut).style('opacity', 1);
    }

    // 4. Match Polygon (Royal Gold-Amber — Distinct Stroke & Fill)
    if (filterMode === 'both' || filterMode === 'match') {
      const matchData = dimensions.map((d) => d.matchScore);
      const matchPath = g
        .append('path')
        .datum(matchData)
        .attr('d', lineGenerator)
        .attr('fill', 'rgba(245, 158, 11, 0.20)')
        .attr('stroke', '#D97706')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '6,3')
        .attr('stroke-linejoin', 'round')
        .style('opacity', 0);

      matchPath.transition().duration(700).delay(120).ease(d3.easeCubicOut).style('opacity', 1);
    }

    // Helper to draw a super-clear mini percentage pill directly next to a polygon vertex
    const appendVertexScoreTag = (
      x: number,
      y: number,
      score: number,
      variant: 'user' | 'match' | 'shared',
      onClick: () => void
    ) => {
      const tagW = 36;
      const tagH = 17;
      const fill =
        variant === 'shared'
          ? '#0B5D3B'
          : isDark
          ? variant === 'user'
            ? '#064E3B'
            : '#451A03'
          : '#FFFFFF';
      const stroke =
        variant === 'shared'
          ? '#D4AF37'
          : variant === 'user'
          ? '#10B981'
          : '#D97706';
      const textFill =
        variant === 'shared'
          ? '#FFFFFF'
          : variant === 'user'
          ? isDark
            ? '#6EE7B7'
            : '#065F46'
          : isDark
          ? '#FDE68A'
          : '#B45309';

      const tagGroup = g
        .append('g')
        .attr('transform', `translate(${x}, ${y})`)
        .attr('class', 'cursor-pointer')
        .on('click', onClick);

      tagGroup
        .append('rect')
        .attr('x', -tagW / 2)
        .attr('y', -tagH / 2)
        .attr('width', tagW)
        .attr('height', tagH)
        .attr('rx', 8.5)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', 1.5);

      tagGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 0.5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('direction', 'ltr')
        .attr('font-size', '10.5px')
        .attr('font-weight', '900')
        .attr('fill', textFill)
        .style('font-variant-numeric', 'tabular-nums')
        .text(`${score}%`);
    };

    // 5. Polygon Vertex Dots + Direct Per-Vertex Percentage Tags
    dimensions.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      // Tangential unit vector so side-by-side tags stay super clean
      const tanX = -sinA;
      const tanY = cosA;

      const rU = rScale(d.userScore);
      const rM = rScale(d.matchScore);
      const xu = cosA * rU;
      const yu = sinA * rU;
      const xm = cosA * rM;
      const ym = sinA * rM;

      const selectThis = () => {
        playClickPop();
        setSelectedDimId(d.id);
      };

      if (filterMode === 'user') {
        g.append('circle')
          .attr('cx', xu)
          .attr('cy', yu)
          .attr('r', 6)
          .attr('fill', '#059669')
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 2.2)
          .attr('class', 'cursor-pointer')
          .on('click', selectThis);

        appendVertexScoreTag(
          cosA * (rU + 16),
          sinA * (rU + 16),
          d.userScore,
          'user',
          selectThis
        );
      } else if (filterMode === 'match') {
        g.append('circle')
          .attr('cx', xm)
          .attr('cy', ym)
          .attr('r', 6)
          .attr('fill', '#D97706')
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 2.2)
          .attr('class', 'cursor-pointer')
          .on('click', selectThis);

        appendVertexScoreTag(
          cosA * (rM + 16),
          sinA * (rM + 16),
          d.matchScore,
          'match',
          selectThis
        );
      } else {
        // filterMode === 'both': render BOTH dots and BOTH clear percentages!
        if (d.diffPercent === 0) {
          // Shared exact vertex: concentric dual emerald-gold dot + unified percentage tag
          g.append('circle')
            .attr('cx', xu)
            .attr('cy', yu)
            .attr('r', 7)
            .attr('fill', '#D4AF37')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2)
            .attr('class', 'cursor-pointer')
            .on('click', selectThis);

          g.append('circle')
            .attr('cx', xu)
            .attr('cy', yu)
            .attr('r', 4)
            .attr('fill', '#059669')
            .attr('class', 'cursor-pointer')
            .on('click', selectThis);

          appendVertexScoreTag(
            cosA * (rU - 18),
            sinA * (rU - 18),
            d.userScore,
            'shared',
            selectThis
          );
        } else {
          // Distinct Emerald & Gold dots
          g.append('circle')
            .attr('cx', xu)
            .attr('cy', yu)
            .attr('r', 5.8)
            .attr('fill', '#059669')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2)
            .attr('class', 'cursor-pointer')
            .on('click', selectThis);

          g.append('circle')
            .attr('cx', xm)
            .attr('cy', ym)
            .attr('r', 5.8)
            .attr('fill', '#D97706')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2)
            .attr('class', 'cursor-pointer')
            .on('click', selectThis);

          const userIsOuter = d.userScore >= d.matchScore;
          const rOuterLabel = Math.min(radius + 11, (userIsOuter ? rU : rM) + 14);
          const rInnerLabel = Math.max(42, (userIsOuter ? rM : rU) - 14);

          if (userIsOuter) {
            appendVertexScoreTag(
              cosA * rOuterLabel + tanX * 6,
              sinA * rOuterLabel + tanY * 6,
              d.userScore,
              'user',
              selectThis
            );
            appendVertexScoreTag(
              cosA * rInnerLabel - tanX * 6,
              sinA * rInnerLabel - tanY * 6,
              d.matchScore,
              'match',
              selectThis
            );
          } else {
            appendVertexScoreTag(
              cosA * rOuterLabel + tanX * 6,
              sinA * rOuterLabel + tanY * 6,
              d.matchScore,
              'match',
              selectThis
            );
            appendVertexScoreTag(
              cosA * rInnerLabel - tanX * 6,
              sinA * rInnerLabel - tanY * 6,
              d.userScore,
              'user',
              selectThis
            );
          }
        }
      }
    });

    // 6. Clean, Non-Overlapping Central Medallion Hub
    const centerValue =
      filterMode === 'user'
        ? averageUserScore
        : filterMode === 'match'
        ? averageMatchScore
        : averageOverlap;

    g.append('circle')
      .attr('r', 24)
      .attr('fill', filterMode === 'match' ? '#B45309' : '#0B5D3B')
      .attr('stroke', '#D4AF37')
      .attr('stroke-width', 2.5);

    g.append('text')
      .attr('x', 0)
      .attr('y', 0.5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('direction', 'ltr')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '13px')
      .attr('font-weight', '900')
      .style('font-variant-numeric', 'tabular-nums')
      .text(`${centerValue}%`);
  }, [
    dimensions,
    filterMode,
    averageOverlap,
    averageUserScore,
    averageMatchScore,
    language,
    isAr,
    activeDimension,
  ]);

  return (
    <div
      data-custom-glow="true"
      {...glowHandlers}
      className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-b from-[#FAF8F5] via-[#F5F2EB] to-[#EAE4D6] dark:from-[#18231C] dark:via-[#141C16] dark:to-[#101612] border-2 border-[#E2D9C8] dark:border-slate-800 shadow-[0_6px_0_0_#D5CEBE,0_14px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_0_0_#0D130F]"
    >
      {/* Dynamic Touch Glow Halo */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-400 ease-out z-0"
        style={{
          opacity: glowPos.active ? 1 : 0,
          background: `radial-gradient(250px circle at ${glowPos.x}% ${glowPos.y}%, rgba(16, 185, 129, 0.30), rgba(212, 175, 55, 0.18), transparent 72%)`,
        }}
      />

      {/* 1. Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-3 border-b-2 border-[#E7DFC9] dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#0B5D3B] text-white flex items-center justify-center shadow-xs shrink-0">
            <Zap size={17} className="text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-[#142019] dark:text-white leading-tight truncate">
              {isAr ? 'رادار النسب والفروقات التفصيلي' : 'Personality Overlap & Differences Radar'}
            </h3>
            <span className="text-xs font-bold text-[#5C6860] dark:text-slate-300 block truncate">
              {isAr
                ? 'نسبة كل بُعد والفروقات بينكما موضحة بالأرقام'
                : 'Clear percentage & gap on every dimension'}
            </span>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-2xl bg-[#0B5D3B] text-white border border-[#D4AF37]/75 flex items-center gap-1.5 shrink-0 shadow-2xs">
          <Sparkles size={13} className="text-[#FDE68A]" />
          <span className="text-xs sm:text-sm font-black tabular-nums whitespace-nowrap">
            {averageOverlap}% {isAr ? 'تداخل' : 'Overlap'}
          </span>
        </div>
      </div>

      {/* 2. Layer Filter Buttons */}
      <div className="relative z-10 mt-3 grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#E7E1D3] dark:bg-[#101712] border border-[#D8CEBC] dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            playClickPop();
            setFilterMode('both');
          }}
          className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            filterMode === 'both'
              ? 'bg-[#0B5D3B] text-white shadow-xs'
              : 'text-[#4B5850] dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          {isAr ? 'التداخل المشترك ⚡' : 'Both Overlap ⚡'}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickPop();
            setFilterMode('user');
          }}
          className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            filterMode === 'user'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-[#4B5850] dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          {isAr ? 'أنت (زمردي) 🟢' : 'You (Emerald) 🟢'}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickPop();
            setFilterMode('match');
          }}
          className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            filterMode === 'match'
              ? 'bg-[#D97706] text-white shadow-xs'
              : 'text-[#4B5850] dark:text-slate-300 hover:text-black dark:hover:text-white'
          }`}
        >
          {isAr ? 'الشبيه (ذهبي) 🟡' : 'Twin (Gold) 🟡'}
        </button>
      </div>

      {/* 3. D3 Polar SVG Chart Canvas with Clear Percentages on Every Axis & Vertex */}
      <div className="relative z-10 mt-1 flex items-center justify-center">
        <svg ref={svgRef} className="w-full max-w-[440px] h-auto aspect-[468/424] overflow-visible select-none" />
      </div>

      {/* 4. All-6-Dimensions Clear Percentage & Difference Breakdown Grid */}
      <div className="relative z-10 mt-2 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-[#1A261F] dark:text-white">
            {isAr ? 'نسب التوافق والفروقات لكل مكان:' : 'Percentages & Differences by Dimension:'}
          </span>
          <span className="text-[11px] font-bold text-[#0B5D3B] dark:text-[#34D399]">
            {isAr ? 'اضغط أي خانة لعرض الإجابات' : 'Tap any box for answers'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {dimensions.map((dim) => {
            const isSelected = activeDimension?.id === dim.id;
            return (
              <button
                key={dim.id}
                type="button"
                onClick={() => {
                  playClickPop();
                  setSelectedDimId(dim.id);
                }}
                className={`p-2.5 rounded-2xl text-start border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1D2A22] border-[#0B5D3B] dark:border-[#34D399] shadow-sm'
                    : 'bg-white/80 dark:bg-[#151F19] border-[#DFD7C6] dark:border-slate-800 hover:border-[#0B5D3B]/45'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-[#18221C] dark:text-white truncate">
                    {isAr ? dim.labelAr : dim.labelEn}
                  </span>
                  <span
                    dir="ltr"
                    className={`px-1.5 py-0.5 rounded-lg text-xs font-black tabular-nums shrink-0 ${
                      dim.overlapScore >= 85
                        ? 'bg-[#0B5D3B] text-white'
                        : dim.overlapScore >= 60
                        ? 'bg-[#FEF3C7] dark:bg-[#422006] text-[#92400E] dark:text-[#FDE68A]'
                        : 'bg-[#FFEDD5] dark:bg-[#431407] text-[#C2410C] dark:text-[#FDBA74]'
                    }`}
                  >
                    {dim.overlapScore}%
                  </span>
                </div>

                {/* Dual Emerald vs Gold Comparison Bars */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-black">
                    <span className="text-[#065F46] dark:text-[#6EE7B7] truncate">
                      {isAr ? 'أنت' : 'You'}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10B981]"
                        style={{ width: `${dim.userScore}%` }}
                      />
                    </div>
                    <span dir="ltr" className="tabular-nums text-[#065F46] dark:text-[#6EE7B7] w-8 text-end">
                      {dim.userScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-black">
                    <span className="text-[#B45309] dark:text-[#FBBF24] truncate">
                      {isAr ? 'الشبيه' : 'Twin'}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#D97706]"
                        style={{ width: `${dim.matchScore}%` }}
                      />
                    </div>
                    <span dir="ltr" className="tabular-nums text-[#B45309] dark:text-[#FBBF24] w-8 text-end">
                      {dim.matchScore}%
                    </span>
                  </div>
                </div>

                {/* Explicit Difference Indicator */}
                <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10.5px] font-black">
                  <span className="text-[#647068] dark:text-slate-400">
                    {dim.diffPercent === 0
                      ? isAr
                        ? 'تطابق كامل ✓'
                        : 'Exact Match ✓'
                      : isAr
                      ? 'الفرق بينكما:'
                      : 'Difference:'}
                  </span>
                  <span
                    dir="ltr"
                    className={`tabular-nums ${
                      dim.diffPercent === 0
                        ? 'text-[#059669] dark:text-[#34D399]'
                        : 'text-[#D97706] dark:text-[#FBBF24]'
                    }`}
                  >
                    {dim.diffPercent === 0 ? '0%' : `${dim.diffPercent}%`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Selected Dimension Answer Comparison Card */}
      {activeDimension && (
        <div className="relative z-10 mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#1B261F] border-2 border-[#0B5D3B]/45 dark:border-[#34D399]/45 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs sm:text-sm font-black text-[#0B5D3B] dark:text-[#34D399]">
              {isAr ? activeDimension.labelAr : activeDimension.labelEn}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-black tabular-nums text-white px-2.5 py-0.5 rounded-lg bg-[#0B5D3B]">
                {activeDimension.overlapScore}% {isAr ? 'توافق' : 'Match'}
              </span>
              {activeDimension.diffPercent > 0 && (
                <span className="text-xs font-black tabular-nums text-[#92400E] dark:text-[#FDE68A] px-2 py-0.5 rounded-lg bg-[#FEF3C7] dark:bg-[#422006] border border-[#F59E0B]/50">
                  {isAr ? `فرق ${activeDimension.diffPercent}%` : `${activeDimension.diffPercent}% Gap`}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/35 border border-emerald-300/80 dark:border-emerald-800">
              <div className="flex items-center justify-between text-[11px] text-[#065F46] dark:text-[#34D399] font-black">
                <span>{isAr ? 'اختيارك أنت:' : 'Your Choice:'}</span>
                <span dir="ltr" className="tabular-nums">{activeDimension.userScore}%</span>
              </div>
              <span className="text-[#18221C] dark:text-white font-extrabold mt-1 block leading-snug">
                {activeDimension.userAnswerLabel}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300/80 dark:border-amber-800">
              <div className="flex items-center justify-between text-[11px] text-[#B45309] dark:text-[#FBBF24] font-black">
                <span className="truncate">{isAr ? `@${match.username}:` : `@${match.username}:`}</span>
                <span dir="ltr" className="tabular-nums">{activeDimension.matchScore}%</span>
              </div>
              <span className="text-[#18221C] dark:text-white font-extrabold mt-1 block leading-snug">
                {activeDimension.matchAnswerLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Quick Legend Info */}
      <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-black text-[#4B5850] dark:text-slate-300 pt-2.5 border-t border-[#E7DFC9] dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#059669] border border-white shadow-2xs" />
          <span>{isAr ? `أنت (${averageUserScore}%)` : `You (${averageUserScore}%)`}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#D97706] border border-white shadow-2xs" />
          <span dir="ltr">
            @{match.username} ({averageMatchScore}%)
          </span>
        </span>
        <span className="flex items-center gap-1 text-[#0B5D3B] dark:text-[#34D399]">
          <Info size={13} />
          <span>{isAr ? 'الخط الذهبي يوضح الفروقات' : 'Amber bar shows gap'}</span>
        </span>
      </div>
    </div>
  );
};
