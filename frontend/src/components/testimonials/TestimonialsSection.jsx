import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import CommentCard from "../comments/CommentCard";

import { fetchHomeComments } from "../../features/comment/commentsThunks";
import {
  selectHomeComments,
  selectHomeFeedMeta,
} from "../../features/comment/commentsSlice";

export default function TestimonialsSection() {
  const dispatch = useDispatch();

  const comments = useSelector(selectHomeComments);
  const { initialized, loading } = useSelector(selectHomeFeedMeta);

  useEffect(() => {
    dispatch(fetchHomeComments({ limit: 6 }));
  }, [dispatch]);

  if (!initialized || loading || !comments || comments.length === 0)
    return null;

  const highlight = comments[0];
  const side = comments.slice(1, 3);
  const bottom = comments.slice(3, 6);

  return (
    <section className="bg-muted py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8">
        {/* HEADER */}
        <div className="mb-10 sm:mb-12 md:mb-16 lg:mb-20 text-center lg:text-left">
          <p className="text-xs sm:text-sm tracking-widest text-primary/60">
            TESTIMONIALS
          </p>
          <h2 className="mt-2 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-semibold leading-snug">
            Trusted by teams
          </h2>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-8 xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Highlight */}
          {highlight && (
            <div className="col-span-1 md:col-span-2 lg:col-span-5 xl:col-span-6">
              <CommentCard item={highlight} large />
            </div>
          )}

          {/* Side comments */}
          {side.map((item) => (
            <div
              key={item.id}
              className="col-span-1 md:col-span-1 lg:col-span-3 xl:col-span-3"
            >
              <CommentCard item={item} />
            </div>
          ))}

          {/* Bottom comments */}
          {bottom.map((item) => (
            <div
              key={item.id}
              className="col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4"
            >
              <CommentCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
