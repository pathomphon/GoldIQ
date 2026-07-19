import type { MarketBriefResult } from '@/features/market-intelligence/types';

const dateTime = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
});

export function MarketBriefPanel({ result }: { readonly result: MarketBriefResult }) {
  const brief = result.data;

  if (!brief) {
    return (
      <section className="market-brief market-brief--empty" aria-labelledby="market-brief-title">
        <div>
          <p className="eyebrow">GOLD RESEARCH AGENT</p>
          <h2 id="market-brief-title">Market brief</h2>
        </div>
        <p>
          {result.error ??
            'ยังไม่มี market brief — Research Agent จะเริ่มทำงานเมื่อเปิดใช้งานและมีหลักฐานใหม่'}
        </p>
      </section>
    );
  }

  return (
    <section className="market-brief" aria-labelledby="market-brief-title">
      <div className="market-brief__heading">
        <div>
          <p className="eyebrow">GOLD RESEARCH AGENT</p>
          <h2 id="market-brief-title">Market brief</h2>
        </div>
        <div className="market-brief__status">
          <strong className={`brief-stance brief-stance--${brief.stance.toLowerCase()}`}>
            {brief.stance}
          </strong>
          <span>Data confidence {(brief.confidence * 100).toFixed(0)}%</span>
          <time dateTime={brief.generatedAt}>{dateTime.format(new Date(brief.generatedAt))}</time>
        </div>
      </div>

      {brief.isStale ? <p className="brief-warning">ข้อมูลวิเคราะห์ชุดนี้หมดอายุแล้ว</p> : null}
      <p className="market-brief__summary">{brief.summary}</p>

      <div className="market-brief__factors">
        <article>
          <h3>ปัจจัยสนับสนุนทองคำ</h3>
          {brief.bullishFactors.length > 0 ? (
            <ul>
              {brief.bullishFactors.map((factor) => (
                <li key={factor.text}>{factor.text}</li>
              ))}
            </ul>
          ) : (
            <p>ไม่พบปัจจัยที่มีหลักฐานเพียงพอ</p>
          )}
        </article>
        <article>
          <h3>ปัจจัยกดดันทองคำ</h3>
          {brief.bearishFactors.length > 0 ? (
            <ul>
              {brief.bearishFactors.map((factor) => (
                <li key={factor.text}>{factor.text}</li>
              ))}
            </ul>
          ) : (
            <p>ไม่พบปัจจัยที่มีหลักฐานเพียงพอ</p>
          )}
        </article>
      </div>

      <div className="market-brief__evidence">
        <h3>หลักฐานอ้างอิง</h3>
        <ol>
          {brief.evidence.map((item) => (
            <li key={item.id}>
              <a href={item.canonicalUrl} rel="noreferrer" target="_blank">
                {item.title}
              </a>
              <span>
                {item.source} · {dateTime.format(new Date(item.publishedAt))}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="market-brief__disclaimer">
        ข้อมูลเพื่อประกอบการวิเคราะห์ ไม่ใช่คำแนะนำทางการเงินและไม่รับประกันผลตอบแทน
      </p>
    </section>
  );
}
